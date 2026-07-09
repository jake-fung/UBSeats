# Room Timetable — Design

## Problem

Room detail cards show a single `AvailabilityBadge` ("Available until 3pm" / "Busy until 4pm"), but there's no way to see the shape of a room's day at a glance — when it opens, when it's busy, when it's free.

## Scope

Presentational only. `RoomAvailability.slots` (declared in `src/supabase/schema/types.ts`) is never actually populated: the `sync-libcal-availability` edge function (`supabase/functions/sync-libcal-availability/index.ts`) computes per-slot data via `parseAvailability.ts` but only persists the derived summary (`isAvailableNow` / `availableUntil` / `nextAvailableAt`) to the `room_availability` table. Wiring real per-slot booking data end-to-end (edge function → DB migration → `supabaseService.ts` → hook) is explicitly deferred to a later task.

This task also does not touch `Room.hours` — that field is declared on the `Room` type but `supabaseService.ts` never populates it (only `Building.hours` and `Library.hours` are fetched from their own tables). Rooms inherit their parent's hours; there is no room-level hours source today.

## Component: `RoomTimetable`

New file: `src/components/details/RoomTimetable.tsx`.

```ts
interface TimeSlot {
  start: string; // ISO 8601
  end: string; // ISO 8601
  available: boolean;
}

interface RoomTimetableProps {
  hours: DayHours[]; // the room's parent building/library hours
  slots?: TimeSlot[]; // booked/available overrides; omitted = "no booking data known"
}
```

`TimeSlot` mirrors the `Slot` shape already defined in `supabase/functions/sync-libcal-availability/parseAvailability.ts`, so a future task can wire real data into this prop without changing its shape. It's declared locally in the component file (not added to `src/supabase/schema/types.ts`) since it isn't actually Supabase-sourced yet.

No `date` prop — the component always renders **today** (`new Date()` at render time). Adding date navigation is out of scope; it can be added later without breaking this API.

## Block computation

The day is divided into 96 fixed 15-minute blocks (00:00–24:00). For each block:

1. Find today's `DayHours` entry (`hours.find(h => h.dayOfWeek === date.getDay())`).
2. Determine open/closed for the block's start-of-minute using the existing midnight-crossing-aware logic in `src/utils/hoursUtils.ts`. The private `isSpotNowOpen(opensMinutes, closesMinutes, currentMinutes)` helper is exported (previously unexported) and reused here instead of duplicating that logic — it's called once per block with the block's start-of-day minute in place of "now."
3. Outside hours → **grey**.
4. Inside hours: if any `slots` entry overlaps `[blockStart, blockEnd)` with `available: false` → **red**. Otherwise → **green**. A block defaults to available when no slot data says otherwise — omitting `slots` entirely means the whole open period renders green, which is an accurate reflection of "no booking data known" rather than a fabricated status.

## Rendering & interaction

- Horizontal `overflow-x-auto` flex strip of 96 blocks. Total width exceeds the room-card column, which is the intended horizontally-scrollable behavior.
- No hour-tick labels (explicitly declined in favor of keeping it minimal).
- Each block has a native `title` tooltip, e.g. `"9:00am–9:15am · Available"` / `"...· Unavailable"` / `"...· Closed"` — no extra tooltip library.
- On mount, the current-time block is scrolled into view via `scrollIntoView({ inline: 'center' })` so the strip opens centered on "now" rather than at midnight.

## Integration into `RoomCard`

Follows the existing expand/collapse convention already used in `HoursPill.tsx` and `LibraryCard.tsx` (`useState` + `max-h-0` → `max-h-[...]` transition with `opacity`/`overflow-hidden`), rather than introducing a new interaction pattern.

- `RoomCard` gains a `hours: DayHours[]` prop and a click target (the card, matching `LibraryCard`'s existing `onClick` pattern) that toggles an `expanded` boolean, revealing `<RoomTimetable hours={hours} />` when true. No `slots` prop is passed yet — real per-slot data is future work.
- `hours` is threaded down through existing call sites, which already have the relevant data in scope:
  - `BuildingDetailContent` → `RoomSection` (gains a `hours: DayHours[]` prop) → `RoomCard`, passing `building?.hours ?? []`.
  - `LibraryCard` → `RoomCard`, passing `library.hours` directly.
- No Supabase or edge function changes.

## Files touched

- `src/components/details/RoomTimetable.tsx` (new)
- `src/utils/hoursUtils.ts` (export `isSpotNowOpen`)
- `src/components/details/RoomCard.tsx` (expand/collapse + render timetable)
- `src/components/details/RoomSection.tsx` (thread `hours` prop)
- `src/components/details/BuildingDetailContent.tsx` (pass `building?.hours`)
- `src/components/details/LibraryCard.tsx` (pass `library.hours`)
