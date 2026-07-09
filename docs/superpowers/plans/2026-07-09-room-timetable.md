# Room Timetable Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `RoomTimetable` component that renders a horizontally-scrollable strip of 96 fifteen-minute blocks for today, colored green (available) / red (booked) / grey (outside opening hours), and reveal it inside `RoomCard` on click.

**Architecture:** A pure function `computeDayBlocks` in `src/utils/hoursUtils.ts` turns `DayHours[]` + an optional `TimeSlot[]` into 96 `DayBlock` objects. `RoomTimetable` is a thin rendering layer over that function. `RoomCard` gains local expand/collapse state (mirroring the existing `LibraryCard` pattern) and a new required `hours` prop, threaded down from `BuildingDetailContent` (building hours) and `LibraryCard` (library hours) through `RoomSection`.

**Tech Stack:** React 19 + TypeScript, Tailwind CSS, existing `cn()` class merger. No new dependencies.

## Global Constraints

- Presentational only — no changes to Supabase tables, the `sync-libcal-availability` edge function, or `supabaseService.ts`. (spec: Scope)
- `RoomTimetable` takes no `date` prop — always renders today via `new Date()`. (spec: Component API)
- No hour-tick labels in the rendered strip. (spec: Rendering & interaction)
- Every block gets a native `title` tooltip with its time range and status. (spec: Rendering & interaction)
- On mount, the current-time block scrolls into view via `scrollIntoView({ inline: 'center' })`. (spec: Rendering & interaction)
- Reuse the existing midnight-crossing-aware `isSpotNowOpen` from `src/utils/hoursUtils.ts` rather than reimplementing open/closed logic. (spec: Block computation)
- A block defaults to `available` when no `slots` entry says otherwise — omitting `slots` renders the whole open period green. (spec: Block computation)
- This project has no frontend test runner (`package.json` has no `test` script, no vitest/jest/testing-library dependency — confirmed by inspection) and per project convention (CLAUDE.md, and prior "tech-debt deferred scope" decisions) that gap is not being closed by this task. Verification below uses `npx tsc -b --noEmit` (type safety — confirmed to run cleanly on this repo today), `npm run lint`, and manual browser checks instead of unit tests.

---

### Task 1: Day-block computation logic

**Files:**
- Modify: `src/utils/hoursUtils.ts`

**Interfaces:**
- Produces: `export function isSpotNowOpen(opensMinutes: number, closesMinutes: number, currentMinutes: number): boolean` (existing function, newly exported)
- Produces: `export type BlockStatus = 'available' | 'unavailable' | 'closed'`
- Produces: `export interface TimeSlot { start: string; end: string; available: boolean }`
- Produces: `export interface DayBlock { start: Date; end: Date; status: BlockStatus }`
- Produces: `export function computeDayBlocks(hours: DayHours[], slots: TimeSlot[] | undefined, now: Date): DayBlock[]` — returns exactly 96 entries, one per 15-minute block of `now`'s calendar day, in chronological order starting at 00:00.

- [ ] **Step 1: Export `isSpotNowOpen`**

In `src/utils/hoursUtils.ts`, change:

```ts
function isSpotNowOpen(opensMinutes: number, closesMinutes: number, currentMinutes: number): boolean {
```

to:

```ts
export function isSpotNowOpen(opensMinutes: number, closesMinutes: number, currentMinutes: number): boolean {
```

- [ ] **Step 2: Append the block types and `computeDayBlocks`**

Add this to the end of `src/utils/hoursUtils.ts`:

```ts
export type BlockStatus = 'available' | 'unavailable' | 'closed';

export interface TimeSlot {
  start: string; // ISO 8601
  end: string; // ISO 8601
  available: boolean;
}

export interface DayBlock {
  start: Date;
  end: Date;
  status: BlockStatus;
}

const BLOCK_MINUTES = 15;
const BLOCKS_PER_DAY = (24 * 60) / BLOCK_MINUTES;

export function computeDayBlocks(hours: DayHours[], slots: TimeSlot[] | undefined, now: Date): DayBlock[] {
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayHours = hours.find((h) => h.dayOfWeek === now.getDay());
  const opensMinutes = todayHours?.opensAt ? parseTime(todayHours.opensAt) : null;
  const closesMinutes = todayHours?.closesAt ? parseTime(todayHours.closesAt) : null;

  return Array.from({ length: BLOCKS_PER_DAY }, (_, i) => {
    const blockMinutes = i * BLOCK_MINUTES;
    const start = new Date(dayStart.getTime() + blockMinutes * 60_000);
    const end = new Date(start.getTime() + BLOCK_MINUTES * 60_000);

    const isOpen =
      opensMinutes !== null && closesMinutes !== null && isSpotNowOpen(opensMinutes, closesMinutes, blockMinutes);

    if (!isOpen) {
      return { start, end, status: 'closed' as const };
    }

    const isBooked = (slots ?? []).some(
      (slot) =>
        slot.available === false &&
        start.getTime() < new Date(slot.end).getTime() &&
        end.getTime() > new Date(slot.start).getTime(),
    );

    return { start, end, status: isBooked ? ('unavailable' as const) : ('available' as const) };
  });
}
```

This reuses the file's existing private `parseTime` helper directly (no export needed — same file) and the now-exported `isSpotNowOpen`.

- [ ] **Step 3: Type-check**

Run: `npx tsc -b --noEmit`
Expected: no output, exit code 0.

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: no errors reported for `src/utils/hoursUtils.ts`.

- [ ] **Step 5: Commit**

```bash
git add src/utils/hoursUtils.ts
git commit -m "feat: add computeDayBlocks for a room's 15-minute day timetable"
```

---

### Task 2: `RoomTimetable` component and `RoomCard` wiring

**Files:**
- Create: `src/components/details/RoomTimetable.tsx`
- Modify: `src/components/details/RoomCard.tsx` (full rewrite)
- Modify: `src/components/details/RoomSection.tsx:1-24`
- Modify: `src/components/details/BuildingDetailContent.tsx:110`
- Modify: `src/components/details/LibraryCard.tsx:44-46`

**Interfaces:**
- Consumes: `computeDayBlocks`, `TimeSlot`, `BlockStatus`, `DayBlock` from `@/utils/hoursUtils` (Task 1); `DayHours` from `@/supabase/schema/types`; `cn` from `@/utils/cnUtils`.
- Produces: `RoomTimetable({ hours: DayHours[], slots?: TimeSlot[] })` — default export is a named export `RoomTimetable`.
- Produces: `RoomCard` now requires a `hours: DayHours[]` prop in addition to the existing `room: Room` prop.

- [ ] **Step 1: Create `RoomTimetable.tsx`**

```tsx
import { useEffect, useMemo, useRef } from 'react';
import { DayHours } from '@/supabase/schema/types';
import { BlockStatus, TimeSlot, computeDayBlocks, formatTime } from '@/utils/hoursUtils';
import { cn } from '@/utils/cnUtils';

export interface RoomTimetableProps {
  hours: DayHours[];
  slots?: TimeSlot[];
}

const STATUS_CLASSES: Record<BlockStatus, string> = {
  available: 'bg-green-400',
  unavailable: 'bg-red-400',
  closed: 'bg-gray-200',
};

const STATUS_LABELS: Record<BlockStatus, string> = {
  available: 'Available',
  unavailable: 'Unavailable',
  closed: 'Closed',
};

function blockTime(date: Date): string {
  const hh = date.getHours().toString().padStart(2, '0');
  const mm = date.getMinutes().toString().padStart(2, '0');
  return formatTime(`${hh}:${mm}`);
}

export const RoomTimetable = ({ hours, slots }: RoomTimetableProps) => {
  const now = useMemo(() => new Date(), []);
  const blocks = useMemo(() => computeDayBlocks(hours, slots, now), [hours, slots, now]);
  const currentIndex = Math.floor((now.getHours() * 60 + now.getMinutes()) / 15);
  const currentBlockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    currentBlockRef.current?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, []);

  return (
    <div className="no-scrollbar flex gap-px overflow-x-auto rounded-md bg-gray-100 p-1">
      {blocks.map((block, i) => (
        <div
          key={block.start.toISOString()}
          ref={i === currentIndex ? currentBlockRef : undefined}
          title={`${blockTime(block.start)}–${blockTime(block.end)} · ${STATUS_LABELS[block.status]}`}
          className={cn('h-6 w-3 shrink-0 rounded-[2px]', STATUS_CLASSES[block.status])}
        />
      ))}
    </div>
  );
};
```

- [ ] **Step 2: Type-check the new component in isolation**

Run: `npx tsc -b --noEmit`
Expected: no output, exit code 0.

- [ ] **Step 3: Rewrite `RoomCard.tsx`**

Replace the full contents of `src/components/details/RoomCard.tsx` with:

```tsx
import { useState } from 'react';
import { DayHours, Room } from '@/supabase/schema/types';
import { NoteTags } from '@/components/details/NoteTags';
import { CategoryTags } from '@/components/details/CategoryTags';
import { CapacityRow } from '@/components/details/CapacityRow';
import { ViewSpaceButton } from '@/components/details/ViewSpaceButton';
import { AvailabilityBadge } from '@/components/details/AvailabilityBadge';
import { RoomTimetable } from '@/components/details/RoomTimetable';
import { useRoomAvailability } from '@/hooks/useRoomAvailability';
import { cn } from '@/utils/cnUtils';

interface RoomCardProps {
  room: Room;
  hours: DayHours[];
}

export const RoomCard = ({ room, hours }: RoomCardProps) => {
  const availability = useRoomAvailability(room.uuid);
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={() => setExpanded((v) => !v)}
      className="flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-white/70 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl sm:flex-row"
    >
      {room.image && (
        <img
          className="aspect-video w-full shrink-0 object-cover sm:aspect-square sm:w-28"
          src={room.image}
          alt={room.name}
          loading="lazy"
        />
      )}
      <div className="flex flex-1 flex-col justify-center px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <CategoryTags categoryIds={room.categoryIds} />
              <NoteTags notes={room.notes} />
            </div>
            <div className="my-1 flex items-center gap-2">
              <h4 className="text-base font-semibold text-gray-900">{room.name}</h4>
              <AvailabilityBadge availability={availability} />
            </div>
            <CapacityRow capacity={room.capacity} />
          </div>
          <ViewSpaceButton link={room.link} />
        </div>
        <div
          className={cn(
            'flex flex-col transition-all duration-300 ease-in-out',
            expanded ? 'mt-3 max-h-[9999px] opacity-100' : 'max-h-0 opacity-0',
          )}
        >
          <RoomTimetable hours={hours} />
        </div>
      </div>
    </div>
  );
};
```

This drops the pre-existing stray `console.log(availability)` debug line while touching this file, adds the `hours` prop, and follows the same expand/collapse convention (`useState` + `max-h-0`/`max-h-[9999px]` + `opacity`) already used in `LibraryCard.tsx`. `ViewSpaceButton` already calls `e.stopPropagation()` internally, so clicking "View" won't also toggle the card.

- [ ] **Step 4: Thread `hours` through `RoomSection.tsx`**

Replace the full contents of `src/components/details/RoomSection.tsx` with:

```tsx
import { DayHours, Room } from '@/supabase/schema/types';
import { RoomCard } from '@/components/details/RoomCard';

interface RoomSectionProps {
  rooms: Room[];
  heading: string;
  hours: DayHours[];
}

/** A titled list of RoomCards; renders nothing when there are no rooms. */
export const RoomSection = ({ rooms, heading, hours }: RoomSectionProps) => {
  if (rooms.length === 0) return null;
  return (
    <>
      <div className="flex items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          {heading} ({rooms.length})
        </h3>
      </div>
      {rooms.map((room) => (
        <RoomCard key={room.uuid} room={room} hours={hours} />
      ))}
    </>
  );
};
```

- [ ] **Step 5: Pass building hours from `BuildingDetailContent.tsx`**

In `src/components/details/BuildingDetailContent.tsx`, change line 110 from:

```tsx
        <RoomSection rooms={building?.rooms || []} heading="Spaces" />
```

to:

```tsx
        <RoomSection rooms={building?.rooms || []} heading="Spaces" hours={building?.hours ?? []} />
```

- [ ] **Step 6: Pass library hours from `LibraryCard.tsx`**

In `src/components/details/LibraryCard.tsx`, change:

```tsx
          {library.rooms.map((room) => (
            <RoomCard key={room.uuid} room={room} />
          ))}
```

to:

```tsx
          {library.rooms.map((room) => (
            <RoomCard key={room.uuid} room={room} hours={library.hours} />
          ))}
```

- [ ] **Step 7: Type-check the full wiring**

Run: `npx tsc -b --noEmit`
Expected: no output, exit code 0. (This is the step that would catch a missed call site — TypeScript errors if any `<RoomCard>` usage is missing the now-required `hours` prop.)

- [ ] **Step 8: Lint**

Run: `npm run lint`
Expected: no errors reported for any of the five touched/created files.

- [ ] **Step 9: Manual browser verification**

Run: `npm run dev`, then open the app in a browser and check:

1. Click a building on the map that has rooms with hours today (e.g. one currently open). Its `BuildingDetail` panel opens.
2. Click a `RoomCard` in the "Spaces" list. It expands to reveal the timetable strip below the room's info row; clicking it again collapses it.
3. In the expanded strip, the blocks during today's opening hours are green, and blocks outside opening hours (before opening / after closing) are grey. Confirm this against the building's actual hours (visible via the `HoursPill` at the top of the panel).
4. Hover over a few blocks — each shows a tooltip with its time range and status (e.g. "9:00am–9:15am · Available").
5. The strip should already be scrolled so the current-time block is roughly centered, without needing to manually scroll to find it.
6. The strip is wider than its container and scrolls horizontally (drag/scroll it left and right).
7. Expand a `RoomCard` that belongs to a library (inside a `LibraryCard`) and confirm it reflects the library's hours, not the parent building's.
8. Click the "View" button on a room that has a link — it should open the link in a new tab and must NOT toggle the timetable open/closed at the same time.

Fix anything that doesn't match before proceeding.

- [ ] **Step 10: Commit**

```bash
git add src/components/details/RoomTimetable.tsx src/components/details/RoomCard.tsx src/components/details/RoomSection.tsx src/components/details/BuildingDetailContent.tsx src/components/details/LibraryCard.tsx
git commit -m "feat: add RoomTimetable and reveal it in RoomCard on click"
```
