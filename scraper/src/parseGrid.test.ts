import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { parseGrid } from './parseGrid';
import { resolveLocation } from './aliasMap';

const FIXTURES_PRESENT = existsSync('fixtures/grid-week-t.html') && existsSync('fixtures/grid-week-n.html');

const SYNTHETIC = `
<html><body>
<p><span class="labelone">Buchanan-A101</span></p>
<p><span class="labeltwo">Monday</span></p>
<table class="spreadsheet">
  <tr><td>Activity</td><td>Description</td><td>Start</td><td>End</td><td>Weeks</td></tr>
  <tr><td>PSYC_V 101-001</td><td>Intro Psychology</td><td>9:00</td><td>11:00</td><td>23</td></tr>
  <tr><td>HIST_V 235-002</td><td></td><td>14:00</td><td>15:30</td><td>23</td></tr>
</table>
<p><span class="labeltwo">Tuesday</span></p>
<table class="spreadsheet">
  <tr><td>Activity</td><td>Description</td><td>Start</td><td>End</td><td>Weeks</td></tr>
</table>
<p><span class="labelone">Hennings 201</span></p>
<p><span class="labeltwo">Friday</span></p>
<table class="spreadsheet">
  <tr><td>Activity</td><td>Description</td><td>Start</td><td>End</td><td>Weeks</td></tr>
  <tr><td>PHYS_V 119-L01</td><td>Physics Lab</td><td>13:00</td><td>16:00</td><td>23</td></tr>
</table>
</body></html>`;

test('parses bookings grouped by location and weekday', () => {
  assert.deepEqual(parseGrid(SYNTHETIC), [
    { locationName: 'Buchanan-A101', weekday: 'Monday', start: '9:00', end: '11:00', title: 'Intro Psychology' },
    { locationName: 'Buchanan-A101', weekday: 'Monday', start: '14:00', end: '15:30', title: null },
    { locationName: 'Hennings 201', weekday: 'Friday', start: '13:00', end: '16:00', title: 'Physics Lab' },
  ]);
});

test('returns an empty list for a page with no spreadsheet tables', () => {
  assert.deepEqual(parseGrid('<html><body><p>nothing here</p></body></html>'), []);
});

test(
  'parses the captured Scientia fixtures (structural invariants)',
  { skip: FIXTURES_PRESENT ? false : 'fixtures not captured yet — Task 2 live capture deferred' },
  () => {
    for (const name of ['grid-week-t.html', 'grid-week-n.html']) {
      const path = `fixtures/${name}`;
      assert.ok(existsSync(path), `${path} missing — run Task 2's capture first`);
      const bookings = parseGrid(readFileSync(path, 'utf8'));
      assert.ok(bookings.length > 0, `${name}: parsed zero bookings — parser does not match the real format`);
      for (const b of bookings) {
        assert.match(b.start, /^\d{1,2}:\d{2}$/);
        assert.match(b.end, /^\d{1,2}:\d{2}$/);
        assert.ok(
          ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].includes(b.weekday),
          `bad weekday: ${b.weekday}`,
        );
      }
      const resolved = bookings.filter((b) => resolveLocation(b.locationName) !== null).length;
      assert.ok(resolved > 0, `${name}: no location names resolved via the alias map`);
      console.log(`${name}: ${bookings.length} bookings, ${resolved} resolved locations`);
    }
  },
);
