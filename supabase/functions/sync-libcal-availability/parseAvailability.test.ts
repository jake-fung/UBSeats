import { assertEquals } from "jsr:@std/assert";
import { parseAvailability, type Slot } from "./parseAvailability.ts";

const NOW = new Date("2026-07-05T20:00:00.000Z");

Deno.test("no slots at all -> available now, no bounds", () => {
  const result = parseAvailability([], NOW);
  assertEquals(result, { isAvailableNow: true, availableUntil: null, nextAvailableAt: null });
});

Deno.test("booked slot covering now -> not available, reports when it ends", () => {
  const slots: Slot[] = [
    { start: "2026-07-05T19:30:00.000Z", end: "2026-07-05T20:30:00.000Z", available: false },
  ];
  const result = parseAvailability(slots, NOW);
  assertEquals(result, {
    isAvailableNow: false,
    availableUntil: null,
    nextAvailableAt: "2026-07-05T20:30:00.000Z",
  });
});

Deno.test("booked slot in the future only -> available now, reports when booking starts", () => {
  const slots: Slot[] = [
    { start: "2026-07-05T21:00:00.000Z", end: "2026-07-05T22:00:00.000Z", available: false },
  ];
  const result = parseAvailability(slots, NOW);
  assertEquals(result, {
    isAvailableNow: true,
    availableUntil: "2026-07-05T21:00:00.000Z",
    nextAvailableAt: null,
  });
});

Deno.test("two consecutive booked slots covering now -> merges into one end time", () => {
  const slots: Slot[] = [
    { start: "2026-07-05T19:30:00.000Z", end: "2026-07-05T20:30:00.000Z", available: false },
    { start: "2026-07-05T20:30:00.000Z", end: "2026-07-05T21:00:00.000Z", available: false },
  ];
  const result = parseAvailability(slots, NOW);
  assertEquals(result, {
    isAvailableNow: false,
    availableUntil: null,
    nextAvailableAt: "2026-07-05T21:00:00.000Z",
  });
});
