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

function isSpotNowOpen(opensMinutes: number, closesMinutes: number, currentMinutes: number): boolean {
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
