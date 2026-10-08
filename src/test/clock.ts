import { vi } from 'vitest';

/** Pins `new Date()` to a Vancouver wall-clock time, e.g. `setNow('2026-10-07T10:00:00')`. Only `Date` is faked. */
export function setNow(local: string): void {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(local));
}

export const WED_10AM = '2026-10-07T10:00:00';
export const WED_8PM = '2026-10-07T20:00:00';
export const SUN_NOON = '2026-10-11T12:00:00';
export const FRI_KEY = '2026-10-09';
