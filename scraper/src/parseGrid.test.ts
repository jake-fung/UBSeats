import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { parseGrid } from './parseGrid';
import { resolveLocation } from './aliasMap';

const HEADER =
  '<tr class="columnTitles"><td>Name</td><td>Section ID</td><td>Type</td><td>Name of Department</td>' +
  '<td>Weeks</td><td>Location</td><td>Staff</td><td>Module</td><td>Day</td><td>Start Time</td><td>End Time</td></tr>';

const row = (name: string, loc: string, day: string, start: string, end: string) =>
  `<tr><td>${name}</td><td></td><td>WRB-ACTIVE</td><td>WRB_UBC</td><td>49</td><td>${loc}</td>` +
  `<td></td><td></td><td>${day}</td><td>${start}</td><td>${end}</td></tr>`;

// Mirrors the real "List Timetable" shape: labelone day heading + spreadsheet
// table with columnTitles, and the same booking repeated across day tables.
const SYNTHETIC = `<html><body>
<p><span class="labelone">Mon</span></p>
<table class="spreadsheet">${HEADER}
${row('PSYC 101 Mon, Wed (week(s): July 20, 2026) 9:00 - BUCH A101', 'BUCH A101', 'Mon,Wed', '9:00', '11:00')}
${row('PSYC 101 Mon, Wed (week(s): July 20, 2026) 9:00 - BUCH A101', 'BUCH A101', 'Mon,Wed', '9:00', '11:00')}
${row('MATH 200 (week(s): July 20, 2026) 14:00 - MATX 1102', 'MATX 1102', 'Mon', '14:00', '15:30')}
</table>
<p><span class="labelone">Wed</span></p>
<table class="spreadsheet">${HEADER}
${row('PSYC 101 Mon, Wed (week(s): July 20, 2026) 9:00 - BUCH A101', 'BUCH A101', 'Mon,Wed', '9:00', '11:00')}
</table>
</body></html>`;

test('parses column rows, takes the weekday from the labelone heading, and dedups repeats', () => {
  assert.deepEqual(parseGrid(SYNTHETIC), [
    { locationName: 'BUCH A101', weekday: 'Monday', start: '9:00', end: '11:00', title: 'PSYC 101' },
    { locationName: 'MATX 1102', weekday: 'Monday', start: '14:00', end: '15:30', title: 'MATH 200' },
    { locationName: 'BUCH A101', weekday: 'Wednesday', start: '9:00', end: '11:00', title: 'PSYC 101' },
  ]);
});

test('returns an empty list when tables have a header but no booking rows', () => {
  const empty = `<html><body><p><span class="labelone">Mon</span></p><table class="spreadsheet">${HEADER}</table></body></html>`;
  assert.deepEqual(parseGrid(empty), []);
});

test('throws when the column header is missing (report structure changed)', () => {
  assert.throws(
    () => parseGrid('<html><body><table class="spreadsheet"><tr><td>x</td><td>y</td></tr></table></body></html>'),
    /column header/i,
  );
});

const FIXTURES = ['grid-week-t.html', 'grid-week-n.html'].filter((f) => existsSync(`fixtures/${f}`));

test(
  'parses the captured Scientia fixtures (real structure)',
  { skip: FIXTURES.length === 0 ? 'no captured fixtures present' : false },
  () => {
    const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    for (const name of FIXTURES) {
      const bookings = parseGrid(readFileSync(`fixtures/${name}`, 'utf8'));
      assert.ok(bookings.length > 100, `${name}: only ${bookings.length} bookings parsed — parser likely off`);
      for (const b of bookings) {
        assert.match(b.start, /^\d{1,2}:\d{2}$/);
        assert.match(b.end, /^\d{1,2}:\d{2}$/);
        assert.ok(DAYS.includes(b.weekday), `bad weekday: ${b.weekday}`);
      }
      const resolved = bookings.filter((b) => resolveLocation(b.locationName) !== null).length;
      assert.ok(resolved >= bookings.length * 0.95, `${name}: only ${resolved}/${bookings.length} locations resolved`);
      console.log(`${name}: ${bookings.length} bookings, ${resolved} resolved locations`);
    }
  },
);
