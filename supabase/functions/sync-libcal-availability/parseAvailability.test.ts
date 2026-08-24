import { assertEquals } from 'jsr:@std/assert';
import { parseAvailability, Slot } from './parseAvailability.ts';

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
