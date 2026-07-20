import { resolveLocation } from './aliasMap';
import { UNMAPPABLE_LOCATIONS } from './config';
import type { RawBooking } from './parseGrid';

export interface BookingRow {
  source_key: string;
  bldg_code: string;
  room_number: string;
  starts_at: string; // UTC ISO
  ends_at: string; // UTC ISO
  title: string | null;
}

export interface TransformResult {
  rows: BookingRow[];
  unmatchedLocations: string[];
}

const WEEKDAY_OFFSET: Record<string, number> = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6,
};

export function mondayOf(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

function localDateTime(weekStart: Date, dayOffset: number, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number);
  return new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + dayOffset, h, m);
}

export function transformBookings(raw: RawBooking[], weekStart: Date): TransformResult {
  const unmatched = new Set<string>();
  const rows: BookingRow[] = [];

  for (const b of raw) {
    if (UNMAPPABLE_LOCATIONS.includes(b.locationName)) continue;
    const loc = resolveLocation(b.locationName);
    if (!loc) {
      unmatched.add(b.locationName);
      continue;
    }
    const offset = WEEKDAY_OFFSET[b.weekday];
    if (offset === undefined) throw new Error(`Unknown weekday: ${b.weekday}`);
    rows.push({
      source_key: `${loc.bldgCode}-${loc.roomNumber}`,
      bldg_code: loc.bldgCode,
      room_number: loc.roomNumber,
      starts_at: localDateTime(weekStart, offset, b.start).toISOString(),
      ends_at: localDateTime(weekStart, offset, b.end).toISOString(),
      title: b.title,
    });
  }

  return { rows, unmatchedLocations: [...unmatched].sort() };
}
