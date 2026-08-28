import { assertEquals } from 'jsr:@std/assert';
import { classifyRooms } from './roomSync.ts';

Deno.test('classifyRooms routes LibCal links by extracting their space id', () => {
  const result = classifyRooms([
    { uuid: 'a', link: 'https://libcal.library.ubc.ca/space/12057' },
    { uuid: 'b', link: 'https://amsubc.libcal.com/space/999' },
  ]);
  assertEquals(result, [
    { kind: 'libcal', uuid: 'a', host: 'libcal.library.ubc.ca', spaceId: '12057' },
    { kind: 'libcal', uuid: 'b', host: 'amsubc.libcal.com', spaceId: '999' },
  ]);
});

Deno.test('classifyRooms skips rooms with no link or an unrecognized link', () => {
  const result = classifyRooms([
    { uuid: 'e', link: null },
    { uuid: 'f', link: 'https://example.com/unrelated' },
  ]);
  assertEquals(result, []);
});

// Sauder's MRBS sites moved behind CWL SSO, so they are no longer a sync source.
// Their links stay in building_rooms as human-facing booking links; this asserts
// they are not mistaken for a fetchable source again.
Deno.test('classifyRooms skips Sauder MRBS booking links', () => {
  const result = classifyRooms([
    { uuid: 'c', link: 'https://booking.sauder.ubc.ca/ugr/' },
    { uuid: 'd', link: 'https://booking.sauder.ubc.ca/clc/' },
  ]);
  assertEquals(result, []);
});
