import { assertEquals } from 'jsr:@std/assert';
import { mergeSlots, parseAvailability, Slot } from './parseAvailability.ts';

// One classroom day as bookingsToSlots would invert it: free 07:00–09:00, booked
// 09:00–10:00, free 10:00–22:00, and nothing at all outside that window. Times are
// UTC so these assertions do not depend on the host machine's timezone.
const DAY: Slot[] = [
  { start: '2026-08-24T07:00:00.000Z', end: '2026-08-24T09:00:00.000Z', available: true },
  { start: '2026-08-24T09:00:00.000Z', end: '2026-08-24T10:00:00.000Z', available: false },
  { start: '2026-08-24T10:00:00.000Z', end: '2026-08-24T22:00:00.000Z', available: true },
];

Deno.test('before the window opens, reports closed and points at the next opening', () => {
  assertEquals(parseAvailability(DAY, new Date('2026-08-24T03:00:00.000Z')), {
    isAvailableNow: false,
    availableUntil: null,
    nextAvailableAt: '2026-08-24T07:00:00.000Z',
  });
});

Deno.test('after the window closes, reports closed with no next opening in this data', () => {
  assertEquals(parseAvailability(DAY, new Date('2026-08-24T23:00:00.000Z')), {
    isAvailableNow: false,
    availableUntil: null,
    nextAvailableAt: null,
  });
});

Deno.test('with no slots held for the room, reports closed rather than free', () => {
  assertEquals(parseAvailability([], new Date('2026-08-24T12:00:00.000Z')), {
    isAvailableNow: false,
    availableUntil: null,
    nextAvailableAt: null,
  });
});

Deno.test('inside a free slot, reports available until the next booking starts', () => {
  assertEquals(parseAvailability(DAY, new Date('2026-08-24T08:00:00.000Z')), {
    isAvailableNow: true,
    availableUntil: '2026-08-24T09:00:00.000Z',
    nextAvailableAt: null,
  });
});

Deno.test('inside a booking, reports unavailable and frees at the booking end', () => {
  assertEquals(parseAvailability(DAY, new Date('2026-08-24T09:30:00.000Z')), {
    isAvailableNow: false,
    availableUntil: null,
    nextAvailableAt: '2026-08-24T10:00:00.000Z',
  });
});

Deno.test('walks back-to-back bookings through to the end of the last contiguous one', () => {
  const slots: Slot[] = [
    { start: '2026-08-24T07:00:00.000Z', end: '2026-08-24T09:00:00.000Z', available: true },
    { start: '2026-08-24T09:00:00.000Z', end: '2026-08-24T10:00:00.000Z', available: false },
    { start: '2026-08-24T10:00:00.000Z', end: '2026-08-24T11:00:00.000Z', available: false },
    { start: '2026-08-24T11:00:00.000Z', end: '2026-08-24T22:00:00.000Z', available: true },
  ];
  assertEquals(
    parseAvailability(slots, new Date('2026-08-24T09:30:00.000Z')).nextAvailableAt,
    '2026-08-24T11:00:00.000Z',
  );
});

Deno.test('treats a slot end as exclusive, so the closing instant reads as closed', () => {
  assertEquals(parseAvailability(DAY, new Date('2026-08-24T22:00:00.000Z')).isAvailableNow, false);
});

Deno.test('treats a slot start as inclusive, so the opening instant reads as available', () => {
  assertEquals(parseAvailability(DAY, new Date('2026-08-24T07:00:00.000Z')).isAvailableNow, true);
});

// 15-minute LibCal-style cells: free 09:00–09:30, booked 09:30–10:00, free 10:00–10:30,
// then a closed gap, then free 12:00–12:30.
const CELLS: Slot[] = [
  { start: '2026-08-24T09:00:00.000Z', end: '2026-08-24T09:15:00.000Z', available: true },
  { start: '2026-08-24T09:15:00.000Z', end: '2026-08-24T09:30:00.000Z', available: true },
  { start: '2026-08-24T09:30:00.000Z', end: '2026-08-24T09:45:00.000Z', available: false },
  { start: '2026-08-24T09:45:00.000Z', end: '2026-08-24T10:00:00.000Z', available: false },
  { start: '2026-08-24T10:00:00.000Z', end: '2026-08-24T10:15:00.000Z', available: true },
  { start: '2026-08-24T10:15:00.000Z', end: '2026-08-24T10:30:00.000Z', available: true },
  { start: '2026-08-24T12:00:00.000Z', end: '2026-08-24T12:15:00.000Z', available: true },
  { start: '2026-08-24T12:15:00.000Z', end: '2026-08-24T12:30:00.000Z', available: true },
];

const RUNS: Slot[] = [
  { start: '2026-08-24T09:00:00.000Z', end: '2026-08-24T09:30:00.000Z', available: true },
  { start: '2026-08-24T09:30:00.000Z', end: '2026-08-24T10:00:00.000Z', available: false },
  { start: '2026-08-24T10:00:00.000Z', end: '2026-08-24T10:30:00.000Z', available: true },
  { start: '2026-08-24T12:00:00.000Z', end: '2026-08-24T12:30:00.000Z', available: true },
];

Deno.test('mergeSlots joins adjacent same-status cells into runs', () => {
  assertEquals(mergeSlots(CELLS), RUNS);
});

Deno.test('mergeSlots never bridges a gap, so closed time stays missing', () => {
  const merged = mergeSlots(CELLS);
  assertEquals(merged[2].end, '2026-08-24T10:30:00.000Z');
  assertEquals(merged[3].start, '2026-08-24T12:00:00.000Z');
});

Deno.test('mergeSlots never merges across a status change', () => {
  assertEquals(
    mergeSlots([
      { start: '2026-08-24T09:00:00.000Z', end: '2026-08-24T09:15:00.000Z', available: true },
      { start: '2026-08-24T09:15:00.000Z', end: '2026-08-24T09:30:00.000Z', available: false },
    ]).length,
    2,
  );
});

Deno.test('mergeSlots sorts unsorted input and does not mutate it', () => {
  const shuffled = [...CELLS].reverse();
  const snapshot = JSON.stringify(shuffled);
  assertEquals(mergeSlots(shuffled), RUNS);
  assertEquals(JSON.stringify(shuffled), snapshot);
});

Deno.test('mergeSlots returns an empty list for no slots', () => {
  assertEquals(mergeSlots([]), []);
});

Deno.test('parseAvailability gives the same answer for merged runs as for raw cells', () => {
  const instants = [
    '2026-08-24T08:00:00.000Z', // before open
    '2026-08-24T09:00:00.000Z', // opening instant
    '2026-08-24T09:20:00.000Z', // free, booking ahead
    '2026-08-24T09:40:00.000Z', // mid-booking
    '2026-08-24T10:00:00.000Z', // booking just ended
    '2026-08-24T11:00:00.000Z', // closed gap
    '2026-08-24T12:10:00.000Z', // reopened
    '2026-08-24T13:00:00.000Z', // after close
  ];
  for (const instant of instants) {
    const now = new Date(instant);
    assertEquals(parseAvailability(mergeSlots(CELLS), now), parseAvailability(CELLS, now), instant);
  }
});
