import test from 'node:test';
import assert from 'node:assert/strict';
import { mondayOf, transformBookings } from './transform';

test('mondayOf returns the Monday of the containing week', () => {
  assert.equal(mondayOf(new Date(2026, 6, 26)).toDateString(), 'Mon Jul 20 2026'); // a Sunday
  assert.equal(mondayOf(new Date(2026, 6, 20)).toDateString(), 'Mon Jul 20 2026'); // a Monday
});

test('converts weekday + local time to UTC instants (PDT, -7)', () => {
  const { rows, unmatchedLocations } = transformBookings(
    [{ locationName: 'Buchanan-A101', weekday: 'Wednesday', start: '9:00', end: '11:00', title: 'Intro Psychology' }],
    new Date(2026, 6, 20),
  );
  assert.deepEqual(unmatchedLocations, []);
  assert.deepEqual(rows, [
    {
      source_key: 'BUCH-A101',
      bldg_code: 'BUCH',
      room_number: 'A101',
      starts_at: '2026-07-22T16:00:00.000Z',
      ends_at: '2026-07-22T18:00:00.000Z',
      title: 'Intro Psychology',
    },
  ]);
});

test('handles the fall DST boundary (PST, -8)', () => {
  const { rows } = transformBookings(
    [{ locationName: 'Hennings 201', weekday: 'Monday', start: '9:00', end: '10:00', title: null }],
    new Date(2026, 10, 2), // week after clocks fall back on 2026-11-01
  );
  assert.equal(rows[0].starts_at, '2026-11-02T17:00:00.000Z');
});

test('collects unmatched locations instead of dropping them silently', () => {
  const { rows, unmatchedLocations } = transformBookings(
    [{ locationName: 'Mystery Hall-101', weekday: 'Monday', start: '9:00', end: '10:00', title: null }],
    new Date(2026, 6, 20),
  );
  assert.deepEqual(rows, []);
  assert.deepEqual(unmatchedLocations, ['Mystery Hall-101']);
});

test('throws on an unknown weekday', () => {
  assert.throws(
    () =>
      transformBookings(
        [{ locationName: 'Buchanan-A101', weekday: 'Funday', start: '9:00', end: '10:00', title: null }],
        new Date(2026, 6, 20),
      ),
    /Unknown weekday/,
  );
});
