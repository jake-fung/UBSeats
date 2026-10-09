/**
 * Local-time calendar helpers for the day picker. Everything here uses the browser's
 * zone, matching computeDayBlocks and classroomWindowCoversDate, so all three agree on
 * where a day and a Monday-based week start.
 */

export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

// Day arithmetic on the (y, m, d) triple rather than adding 24h, so a DST day (23 or 25
// hours long) still lands on the next calendar date at local midnight.
export function addLocalDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return startOfLocalDay(a).getTime() === startOfLocalDay(b).getTime();
}

/** Zero-padded local "YYYY-MM-DD", so string comparison is date comparison. */
export function toDateKey(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${mm}-${dd}`;
}

export function fromDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** The 14 days the picker grid shows: this Monday-based week and next, from this week's Monday. */
export function pickerDays(today: Date): Date[] {
  const monday = addLocalDays(today, -((today.getDay() + 6) % 7));
  return Array.from({ length: 14 }, (_, i) => addLocalDays(monday, i));
}

const SHORT_DAY = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

/** Compact day label, e.g. "Thu, Oct 1", shared by the date pill and the in-panel hint. */
export function formatShortDay(date: Date): string {
  return SHORT_DAY.format(date);
}
