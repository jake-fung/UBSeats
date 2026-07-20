import { DayHours } from '@/supabase/schema/types';

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

export type BlockStatus = 'available' | 'unavailable' | 'closed';

export interface TimeSlot {
  start: string; // ISO 8601
  end: string; // ISO 8601
  available: boolean;
}

export interface DayBlock {
  start: Date;
  end: Date;
  status: BlockStatus;
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

    const isBooked = (slots ?? []).some(
      (slot) =>
        slot.available === false &&
        start.getTime() < new Date(slot.end).getTime() &&
        end.getTime() > new Date(slot.start).getTime(),
    );

    return { start, end, status: isBooked ? ('unavailable' as const) : ('available' as const) };
  });
}

export interface BookingInterval {
  startsAt: string; // ISO 8601
  endsAt: string; // ISO 8601
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

  const merged: { start: number; end: number }[] = [];
  bookings
    .map((b) => ({
      start: Math.max(new Date(b.startsAt).getTime(), windowStart),
      end: Math.min(new Date(b.endsAt).getTime(), windowEnd),
    }))
    .filter((b) => b.start < b.end)
    .sort((a, b) => a.start - b.start)
    .forEach((b) => {
      const last = merged[merged.length - 1];
      if (last && b.start <= last.end) last.end = Math.max(last.end, b.end);
      else merged.push({ ...b });
    });

  const slots: TimeSlot[] = [];
  let cursor = windowStart;
  for (const b of merged) {
    if (cursor < b.start) slots.push({ start: new Date(cursor).toISOString(), end: new Date(b.start).toISOString(), available: true });
    slots.push({ start: new Date(b.start).toISOString(), end: new Date(b.end).toISOString(), available: false });
    cursor = b.end;
  }
  if (cursor < windowEnd) slots.push({ start: new Date(cursor).toISOString(), end: new Date(windowEnd).toISOString(), available: true });
  return slots;
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
