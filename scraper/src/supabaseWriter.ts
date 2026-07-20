import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { planRoomSync, type ExistingRoom } from './roomSyncPlan';
import type { BookingRow } from './transform';

export interface WriteSummary {
  roomsMatched: number;
  roomsInserted: number;
  roomsSkippedManual: string[];
  bookingsWritten: number;
}

const PAGE_SIZE = 1000;

async function selectAllPaged<T>(client: SupabaseClient, table: string, columns: string): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client.from(table).select(columns).range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(`${table} select failed: ${error.message}`);
    rows.push(...((data ?? []) as T[]));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return rows;
}

export async function writeToSupabase(rows: BookingRow[], windowStart: Date, windowEnd: Date): Promise<WriteSummary> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in scraper/.env');
  const client = createClient(url, key);

  const buildings = await selectAllPaged<{ uuid: string; bldg_code: string }>(client, 'buildings', 'uuid, bldg_code');
  const existing = await selectAllPaged<ExistingRoom>(client, 'building_rooms', 'uuid, building_uuid, room_name, source_key');
  const buildingUuidByCode = new Map(buildings.map((b) => [b.bldg_code, b.uuid]));

  const scrapedRooms = rows.map(({ source_key, bldg_code, room_number }) => ({ source_key, bldg_code, room_number }));
  const plan = planRoomSync(scrapedRooms, existing, buildingUuidByCode);

  if (plan.toInsert.length > 0) {
    const inserts = plan.toInsert.map((r) => ({
      building_uuid: buildingUuidByCode.get(r.bldg_code) as string,
      room_name: `${r.bldg_code} – Room ${r.room_number}`, // en dash, matches existing convention
      capacity: null,
      link: null,
      source_key: r.source_key,
    }));
    const { data, error } = await client.from('building_rooms').insert(inserts).select('uuid, source_key');
    if (error) throw new Error(`room insert failed: ${error.message}`);
    for (const row of data ?? []) plan.matched.set(row.source_key as string, row.uuid);
    const tags = (data ?? []).map((row) => ({ room_uuid: row.uuid, categories_id: 'classroom' }));
    const { error: tagError } = await client.from('room_categories').insert(tags);
    if (tagError) throw new Error(`room_categories insert failed: ${tagError.message}`);
  }

  const bookingRows = rows
    .filter((r) => plan.matched.has(r.source_key))
    .map((r) => ({
      room_uuid: plan.matched.get(r.source_key) as string,
      starts_at: r.starts_at,
      ends_at: r.ends_at,
      title: r.title,
    }));

  const { data: written, error: rpcError } = await client.rpc('replace_classroom_bookings', {
    p_window_start: windowStart.toISOString(),
    p_window_end: windowEnd.toISOString(),
    p_rows: bookingRows,
  });
  if (rpcError) throw new Error(`replace_classroom_bookings failed: ${rpcError.message}`);

  return {
    roomsMatched: plan.matched.size - plan.toInsert.length,
    roomsInserted: plan.toInsert.length,
    roomsSkippedManual: plan.skippedManual.map((s) => s.source_key),
    bookingsWritten: (written as number | null) ?? bookingRows.length,
  };
}
