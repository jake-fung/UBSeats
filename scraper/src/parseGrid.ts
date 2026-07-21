import { parse } from 'node-html-parser';

export interface RawBooking {
  locationName: string; // e.g. "ALRD B101" (from the report's Location column)
  weekday: string; // 'Monday'..'Sunday'
  start: string; // 24h 'H:MM' or 'HH:MM'
  end: string;
  title: string | null;
}

const DAY_ABBR: Record<string, string> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

const TIME_RE = /^\d{1,2}:\d{2}$/;

interface Columns {
  name: number;
  location: number;
  start: number;
  end: number;
}

/** The Name cell is verbose ("ETEC 565T Mon, Tue ... (week(s): ...) 9:00 - ALRD ..."). Keep the leading code. */
function extractTitle(name: string): string | null {
  const trimmed = name.replace(/\s+/g, ' ').trim();
  if (!trimmed) return null;
  // Cut at the day list ("... Mon, Tue ...") or the week clause ("... (week(s): ...").
  const cut = trimmed.match(/^(.+?)\s+(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b|\(week)/i);
  return (cut ? cut[1] : trimmed).slice(0, 100).trim() || null;
}

/** Read the "List Timetable" column layout once from the first header row. */
function findColumns(root: ReturnType<typeof parse>): Columns | null {
  for (const tr of root.querySelectorAll('tr.columnTitles')) {
    const headers = tr.querySelectorAll('td, th').map((c) => c.text.replace(/\s+/g, ' ').trim().toLowerCase());
    const location = headers.indexOf('location');
    const start = headers.indexOf('start time');
    const end = headers.indexOf('end time');
    if (location !== -1 && start !== -1 && end !== -1) {
      return { name: headers.indexOf('name'), location, start, end };
    }
  }
  return null;
}

/**
 * Parse UBC's Scientia "List Timetable" (UBCSWSActivities_TS) report.
 *
 * The report is a sequence of `<span class="labelone">Mon</span>` day headings,
 * each followed by a `<table class="spreadsheet">` whose rows carry a booking's
 * Location / Start Time / End Time in fixed columns. The weekday comes from the
 * preceding labelone heading (the report lists a booking under every day it
 * occurs), and because a booking is repeated across day tables and rooms, rows
 * are de-duplicated on (location, weekday, start, end).
 */
export function parseGrid(html: string): RawBooking[] {
  const root = parse(html);
  const cols = findColumns(root);
  if (!cols) {
    throw new Error(
      'Could not find the timetable column header (Location / Start Time / End Time). ' +
        'The Scientia "List Timetable" report structure has changed.',
    );
  }

  const bookings: RawBooking[] = [];
  const seen = new Set<string>();
  let weekday: string | null = null;

  for (const el of root.querySelectorAll('span.labelone, table.spreadsheet')) {
    if (el.tagName === 'SPAN') {
      weekday = DAY_ABBR[el.text.trim()] ?? null;
      continue;
    }
    if (!weekday) continue; // a table with no preceding day heading — skip
    for (const tr of el.querySelectorAll('tr')) {
      if (tr.classList.contains('columnTitles')) continue;
      const cells = tr.querySelectorAll('td').map((c) => c.text.replace(/\s+/g, ' ').trim());
      if (cells.length <= cols.end) continue;
      const location = cells[cols.location];
      const start = cells[cols.start];
      const end = cells[cols.end];
      if (!location || !TIME_RE.test(start) || !TIME_RE.test(end)) continue;

      const key = `${location}|${weekday}|${start}|${end}`;
      if (seen.has(key)) continue;
      seen.add(key);
      bookings.push({
        locationName: location,
        weekday,
        start,
        end,
        title: cols.name !== -1 && cells[cols.name] ? extractTitle(cells[cols.name]) : null,
      });
    }
  }
  return bookings;
}
