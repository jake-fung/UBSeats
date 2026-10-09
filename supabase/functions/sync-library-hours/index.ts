import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { fetchBranchIds, fetchMonth } from './libraryClient.ts';
import {
  calendarWeeks,
  monthKey,
  parseHoursTable,
  resolveWeeks,
  type CalendarDate,
  type CalendarWeek,
  type DayRow,
  type HoursTable,
} from './parseHours.ts';

interface SyncTarget {
  kind: 'venue' | 'building';
  id: string;
  branch: string;
}

async function loadTargets(supabase: SupabaseClient): Promise<SyncTarget[]> {
  const [venues, buildings] = await Promise.all([
    supabase.from('venues').select('id, library_branch').not('library_branch', 'is', null),
    supabase.from('buildings').select('uuid, library_branch').not('library_branch', 'is', null),
  ]);
  if (venues.error) throw new Error(venues.error.message);
  if (buildings.error) throw new Error(buildings.error.message);

  return [
    ...venues.data.map((v) => ({ kind: 'venue' as const, id: v.id, branch: v.library_branch })),
    ...buildings.data.map((b) => ({ kind: 'building' as const, id: b.uuid, branch: b.library_branch })),
  ];
}

const toDbRows = (rows: DayRow[]) =>
  rows.map((r) => ({ day_of_week: r.dayOfWeek, opens_at: r.opensAt, closes_at: r.closesAt }));

/**
 * Fetches, parses and replaces one branch's two weeks. Throws if this week fails (all of
 * the branch's rows stay as they were); a failed next week is logged and simply not stored.
 */
async function syncTarget(
  supabase: SupabaseClient,
  target: SyncTarget,
  branchIds: Map<string, string>,
  weeks: { thisWeek: CalendarWeek; nextWeek: CalendarWeek },
): Promise<void> {
  const locationId = branchIds.get(target.branch);
  if (!locationId) throw new Error('branch not found on hours.library.ubc.ca');

  // Each date is resolved against its own month's table.
  const tables = new Map<string, HoursTable>();
  const loadMonthOf = async (date: CalendarDate) => {
    const key = monthKey(date);
    if (!tables.has(key)) tables.set(key, parseHoursTable(await fetchMonth(locationId, date.year, date.month)));
  };
  for (const date of weeks.thisWeek.dates) await loadMonthOf(date);
  try {
    for (const date of weeks.nextWeek.dates) await loadMonthOf(date);
  } catch {
    // A month only next week needs failed to load; resolveWeeks reports next week as missing.
  }

  const { thisRows, nextRows, nextError } = resolveWeeks(tables, weeks.thisWeek, weeks.nextWeek);
  if (nextError) console.warn(`next week not stored for ${target.branch}: ${nextError}`);

  const { error } = await supabase.rpc('replace_library_hours', {
    p_kind: target.kind,
    p_id: target.id,
    p_this_week_start: weeks.thisWeek.start,
    p_this_rows: toDbRows(thisRows),
    p_next_rows: nextRows ? toDbRows(nextRows) : null,
  });
  if (error) throw new Error(`replace_library_hours: ${error.message}`);
}

Deno.serve(async () => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const runStartedAt = new Date();

  let targets: SyncTarget[];
  try {
    targets = await loadTargets(supabase);
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }

  const failed: string[] = [];
  let branchIds: Map<string, string> | null = null;
  try {
    branchIds = await fetchBranchIds();
  } catch (err) {
    // The run started but the site is unreachable: every branch keeps last week's hours.
    console.error('hours.library.ubc.ca unreachable; no branch synced:', err);
    for (const t of targets) failed.push(t.branch);
  }

  if (branchIds) {
    const weeks = calendarWeeks(runStartedAt);
    for (const target of targets) {
      try {
        await syncTarget(supabase, target, branchIds, weeks);
      } catch (err) {
        console.error(`library hours sync failed for ${target.branch}:`, err);
        failed.push(target.branch);
      }
    }
  }

  // Every mapped branch either synced this run or is listed here, so this is exactly the
  // set whose hours_synced_at is older than runStartedAt.
  return Response.json(
    { synced: targets.length - failed.length, failed },
    { status: branchIds ? 200 : 502 },
  );
});
