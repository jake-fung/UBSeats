import { DayHours } from '@/supabase/schema';
import { toDateKey } from '@/utils/dateUtils';

export interface BuildingStatus {
  isOpen: boolean;
  closesAt: string | null;
  opensAt: string | null;
}

function parseTime(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function isSpotNowOpen(opensMinutes: number, closesMinutes: number, currentMinutes: number): boolean {
  if (opensMinutes < closesMinutes) {
    return currentMinutes >= opensMinutes && currentMinutes < closesMinutes;
  } else {
    return currentMinutes >= opensMinutes || currentMinutes < closesMinutes;
  }
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'pm' : 'am';
  const hour = h % 12 || 12;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${m.toString().padStart(2, '0')}${suffix}`;
}

const VANCOUVER_DATE_TIME = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Vancouver',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZoneName: 'short',
});

/** An instant as Vancouver wall-clock time whatever the viewer's zone, e.g. "Sep 28, 3:41 PM PDT". */
export function formatVancouverDateTime(date: Date | number): string {
  return VANCOUVER_DATE_TIME.format(date);
}

/** A building or venue: hand-entered weekly hours, plus synced actual hours per week. */
export interface HoursOwner {
  hours: DayHours[];
  hoursByWeek: Map<string, DayHours[]>;
}

/** The Sunday starting `date`'s week as "YYYY-MM-DD", matching the sync's week_start. */
export function weekStartOf(date: Date): string {
  return toDateKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay()));
}

/**
 * The hours that apply in `date`'s week. Synced owners use that week's actual hours, and
 * `null` means the week isn't stored (not published yet, or the sync failed) — callers
 * show "not published" rather than reusing another week's holidays. Everyone else keeps
 * their hand-entered hours, which repeat every week.
 */
export function hoursForDate(owner: HoursOwner, date: Date): DayHours[] | null {
  if (owner.hoursByWeek.size === 0) return owner.hours;
  return owner.hoursByWeek.get(weekStartOf(date)) ?? null;
}

export function hasAnyHours(owner: HoursOwner): boolean {
  return owner.hours.length > 0 || owner.hoursByWeek.size > 0;
}

export function getBuildingStatus(hours: DayHours[]): BuildingStatus | null {
  if (!hours || hours.length === 0) return null;

  const now = new Date();
  const today = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todayHours = hours.find((h) => h.dayOfWeek === today);
  if (!todayHours || !todayHours.opensAt || !todayHours.closesAt) {
    // Find next open day's opening time
    for (let i = 1; i <= 7; i++) {
      const next = hours.find((h) => h.dayOfWeek === (today + i) % 7);
      if (next?.opensAt) {
        return { isOpen: false, closesAt: null, opensAt: formatTime(next.opensAt) };
      }
    }
    return { isOpen: false, closesAt: null, opensAt: null };
  }

  const opensMinutes = parseTime(todayHours.opensAt);
  const closesMinutes = parseTime(todayHours.closesAt);
  const isOpen = isSpotNowOpen(opensMinutes, closesMinutes, currentMinutes);

  return {
    isOpen,
    closesAt: isOpen ? formatTime(todayHours.closesAt) : null,
    opensAt: isOpen ? null : formatTime(todayHours.opensAt),
  };
}

/**
 * A building counts as open now if its own hours say so, or one of its venues'
 * do — BuildingDetailContent/VenueCard already track those as separate statuses,
 * and most buildings only carry hours through their venues.
 */
export function isBuildingOpenNow(building: HoursOwner, venues: HoursOwner[]): boolean {
  const now = new Date();
  return [building, ...venues].some((owner) => getBuildingStatus(hoursForDate(owner, now) ?? [])?.isOpen === true);
}

export type BlockStatus = 'available' | 'unavailable' | 'closed';

export interface TimeSlot {
  start: string; // ISO 8601
  end: string; // ISO 8601
  available: boolean;
  title?: string | null; // booking name; only carried on unavailable slots
}

export interface DayBlock {
  start: Date;
  end: Date;
  status: BlockStatus;
  title?: string | null;
}

const BLOCK_MINUTES = 15;
const BLOCKS_PER_DAY = (24 * 60) / BLOCK_MINUTES;

export function computeDayBlocks(slots: TimeSlot[] | undefined, now: Date): DayBlock[] {
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return Array.from({ length: BLOCKS_PER_DAY }, (_, i) => {
    const blockMinutes = i * BLOCK_MINUTES;
    const start = new Date(dayStart.getTime() + blockMinutes * 60_000);
    const end = new Date(start.getTime() + BLOCK_MINUTES * 60_000);

    const isOpen = slots?.some(
      (slot) => start.getTime() < new Date(slot.end).getTime() && end.getTime() > new Date(slot.start).getTime(),
    );

    if (!isOpen) {
      return { start, end, status: 'closed' as const };
    }

    const booked = (slots ?? []).filter(
      (slot) =>
        slot.available === false &&
        start.getTime() < new Date(slot.end).getTime() &&
        end.getTime() > new Date(slot.start).getTime(),
    );

    if (booked.length === 0) {
      return { start, end, status: 'available' as const };
    }

    // Back-to-back bookings can share a block, so name every one that overlaps it.
    const titles = [...new Set(booked.map((slot) => slot.title).filter((t): t is string => !!t))];
    return { start, end, status: 'unavailable' as const, title: titles.join(', ') || null };
  });
}

/** A Date's local wall-clock time in the app's display format, e.g. `9:30 AM`. */
export function formatClockTime(date: Date): string {
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  return formatTime(`${hh}:${mm}`);
}

const SUMMARY_LABELS: Record<Exclude<BlockStatus, 'closed'>, string> = {
  available: 'Available',
  unavailable: 'Booked',
};

/**
 * Text alternative for the room timetable strip: adjacent same-status blocks merged, closed time
 * skipped, e.g. `Available 9:00 AM–11:00 AM; Booked 11:00 AM–12:30 PM`. Empty when nothing is open.
 */
export function summarizeDayBlocks(blocks: DayBlock[]): string {
  const runs: { status: Exclude<BlockStatus, 'closed'>; start: Date; end: Date }[] = [];
  for (const block of blocks) {
    if (block.status === 'closed') continue;
    const last = runs[runs.length - 1];
    if (last && last.status === block.status && last.end.getTime() === block.start.getTime()) {
      last.end = block.end;
    } else {
      runs.push({ status: block.status, start: block.start, end: block.end });
    }
  }
  return runs
    .map((run) => `${SUMMARY_LABELS[run.status]} ${formatClockTime(run.start)}–${formatClockTime(run.end)}`)
    .join('; ');
}

export interface BookingInterval {
  startsAt: string; // ISO 8601
  endsAt: string; // ISO 8601
  title?: string | null;
}

const CLASSROOM_DAY_START_HOUR = 7;
const CLASSROOM_DAY_END_HOUR = 22;

/**
 * Invert a classroom's bookings for `date` into the TimeSlot[] shape that
 * computeDayBlocks consumes: available gaps + unavailable bookings inside
 * 07:00–22:00 local; no slots outside the window, so those blocks read closed.
 */
export function bookingsToSlots(bookings: BookingInterval[], date: Date): TimeSlot[] {
  const windowStart = new Date(date.getFullYear(), date.getMonth(), date.getDate(), CLASSROOM_DAY_START_HOUR).getTime();
  const windowEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), CLASSROOM_DAY_END_HOUR).getTime();

  const clamped = bookings
    .map((b) => ({
      start: Math.max(new Date(b.startsAt).getTime(), windowStart),
      end: Math.min(new Date(b.endsAt).getTime(), windowEnd),
      title: b.title ?? null,
    }))
    .filter((b) => b.start < b.end)
    .sort((a, b) => a.start - b.start);

  // Merge only to find the free gaps between bookings; each booking still emits its
  // own unavailable slot below so the timetable can name it. Scheduled classes run
  // back-to-back rather than overlapping, so the split stays exactly adjacent and
  // parseAvailability's walk to the end of a booking chain is unaffected.
  const merged: { start: number; end: number }[] = [];
  clamped.forEach((b) => {
    const last = merged[merged.length - 1];
    if (last && b.start <= last.end) last.end = Math.max(last.end, b.end);
    else merged.push({ start: b.start, end: b.end });
  });

  const slots: TimeSlot[] = [];
  let cursor = windowStart;
  for (const b of merged) {
    if (cursor < b.start)
      slots.push({ start: new Date(cursor).toISOString(), end: new Date(b.start).toISOString(), available: true });
    cursor = b.end;
  }
  if (cursor < windowEnd)
    slots.push({ start: new Date(cursor).toISOString(), end: new Date(windowEnd).toISOString(), available: true });

  clamped.forEach((b) =>
    slots.push({
      start: new Date(b.start).toISOString(),
      end: new Date(b.end).toISOString(),
      available: false,
      title: b.title,
    }),
  );

  return slots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

/**
 * A scrape covers its Monday-based week plus the next week. When `date` falls
 * past that window the data says nothing about today — rendering it would show
 * every classroom as free, so callers must drop stale data entirely.
 */
export function classroomWindowCoversDate(lastScrapedAt: string, date: Date): boolean {
  const scraped = new Date(lastScrapedAt);
  const monday = new Date(scraped.getFullYear(), scraped.getMonth(), scraped.getDate() - ((scraped.getDay() + 6) % 7));
  const windowEndExclusive = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 14);
  return date < windowEndExclusive;
}
