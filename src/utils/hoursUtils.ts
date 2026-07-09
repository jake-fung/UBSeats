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

export function computeDayBlocks(hours: DayHours[], slots: TimeSlot[] | undefined, now: Date): DayBlock[] {
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayHours = hours.find((h) => h.dayOfWeek === now.getDay());
  const opensMinutes = todayHours?.opensAt ? parseTime(todayHours.opensAt) : null;
  const closesMinutes = todayHours?.closesAt ? parseTime(todayHours.closesAt) : null;

  return Array.from({ length: BLOCKS_PER_DAY }, (_, i) => {
    const blockMinutes = i * BLOCK_MINUTES;
    const start = new Date(dayStart.getTime() + blockMinutes * 60_000);
    const end = new Date(start.getTime() + BLOCK_MINUTES * 60_000);

    const isOpen =
      opensMinutes !== null && closesMinutes !== null && isSpotNowOpen(opensMinutes, closesMinutes, blockMinutes);

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
