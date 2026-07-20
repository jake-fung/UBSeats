import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fetchGridPages } from './scrape';
import { parseGrid } from './parseGrid';
import { transformBookings, type BookingRow } from './transform';
import { writeToSupabase } from './supabaseWriter';

const args = new Set(process.argv.slice(2));
const headed = args.has('--headed');
const capture = args.has('--capture');
const live = args.has('--live');

const { pages, formHtml } = await fetchGridPages({ headed });

if (capture) {
  mkdirSync('fixtures', { recursive: true });
  writeFileSync('fixtures/form.html', formHtml);
  const names = ['grid-week-t.html', 'grid-week-n.html'];
  pages.forEach((p, i) => writeFileSync(`fixtures/${names[i]}`, p.html));
  console.log('Fixtures written to fixtures/.');
}

const allRows: BookingRow[] = [];
const allUnmatched = new Set<string>();
for (const page of pages) {
  const { rows, unmatchedLocations } = transformBookings(parseGrid(page.html), page.weekStart);
  rows.forEach((r) => allRows.push(r));
  unmatchedLocations.forEach((u) => allUnmatched.add(u));
  console.log(`week of ${page.weekStart.toDateString()}: ${rows.length} bookings`);
}

const windowStart = pages[0].weekStart;
const last = pages[pages.length - 1].weekStart;
const windowEnd = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 7);

mkdirSync('out', { recursive: true });
const summary: Record<string, unknown> = {
  scrapedAt: new Date().toISOString(),
  window: { start: windowStart.toISOString(), end: windowEnd.toISOString() },
  bookings: allRows.length,
  uniqueRooms: new Set(allRows.map((r) => r.source_key)).size,
  unmatchedLocations: [...allUnmatched].sort(),
};

if (allUnmatched.size > 0) {
  writeFileSync('out/summary.json', JSON.stringify(summary, null, 2));
  console.error(
    `FAILED: ${allUnmatched.size} unmatched Scientia locations (see out/summary.json). ` +
      `Add them to aliasMap.ts, or to UNMAPPABLE_LOCATIONS in config.ts after human review.`,
  );
  process.exit(1);
}

if (live) {
  const result = await writeToSupabase(allRows, windowStart, windowEnd);
  Object.assign(summary, result);
  console.log(
    `LIVE: wrote ${result.bookingsWritten} bookings; matched ${result.roomsMatched} rooms, ` +
      `inserted ${result.roomsInserted}, skipped manual ${result.roomsSkippedManual.length}`,
  );
  if (result.roomsSkippedManual.length > 0) console.log(`  skipped: ${result.roomsSkippedManual.join(', ')}`);
} else {
  writeFileSync('out/bookings.json', JSON.stringify(allRows, null, 2));
  console.log(`DRY RUN: ${allRows.length} bookings written to out/bookings.json (no DB writes).`);
}
writeFileSync('out/summary.json', JSON.stringify(summary, null, 2));
