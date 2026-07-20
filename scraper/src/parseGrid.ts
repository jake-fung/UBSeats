import { parse } from 'node-html-parser';

export interface RawBooking {
  locationName: string;
  weekday: string; // 'Monday'..'Sunday'
  start: string; // 24h 'H:MM' or 'HH:MM'
  end: string;
  title: string | null;
}

const TIME_RE = /^\d{1,2}:\d{2}$/;

export function parseGrid(html: string): RawBooking[] {
  const root = parse(html);
  const bookings: RawBooking[] = [];
  let location: string | null = null;
  let weekday: string | null = null;

  for (const el of root.querySelectorAll('span.labelone, span.labeltwo, table.spreadsheet')) {
    if (el.tagName === 'SPAN' && el.classList.contains('labelone')) {
      location = el.text.trim();
      weekday = null;
    } else if (el.tagName === 'SPAN' && el.classList.contains('labeltwo')) {
      weekday = el.text.trim();
    } else if (el.tagName === 'TABLE' && location && weekday) {
      const rows = el.querySelectorAll('tr');
      if (rows.length < 2) continue;
      const headers = rows[0].querySelectorAll('td, th').map((c) => c.text.trim().toLowerCase());
      const startIdx = headers.indexOf('start');
      const endIdx = headers.indexOf('end');
      const titleIdx = headers.indexOf('description');
      if (startIdx === -1 || endIdx === -1) continue;
      for (const row of rows.slice(1)) {
        const cells = row.querySelectorAll('td').map((c) => c.text.trim());
        if (cells.length <= Math.max(startIdx, endIdx)) continue;
        if (!TIME_RE.test(cells[startIdx]) || !TIME_RE.test(cells[endIdx])) continue;
        bookings.push({
          locationName: location,
          weekday,
          start: cells[startIdx],
          end: cells[endIdx],
          title: titleIdx !== -1 && cells[titleIdx] ? cells[titleIdx] : null,
        });
      }
    }
  }
  return bookings;
}
