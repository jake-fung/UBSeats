# Favourite Rooms — Design Spec

**Date:** 2026-07-22
**Status:** Approved for planning

## Summary

Let users favourite individual rooms and have those favourites persist across
sessions via `localStorage`. Two user-facing capabilities:

- **Persist (A):** a heart toggle on each room card that stays filled when the
  user revisits the room.
- **Filter (B):** a "Favourites" chip in the existing filter bar that narrows
  the map and detail panels to only favourited rooms.

No backend, no auth, no accounts. Favourites are device-local.

## Goals

- A heart toggle on every `RoomCard` (including library rooms).
- Favourites survive reloads and sync live across open tabs.
- A "Favourites" filter chip that behaves like the existing category filters.
- Graceful degradation when `localStorage` is unavailable or corrupt.

## Non-Goals (YAGNI)

- Server-side / cross-device sync or user accounts.
- A dedicated "my favourites" view separate from the filter (scope was A + B,
  not C).
- Multi-select filtering (the bar is single-select today; we keep it that way).
- A bespoke empty-state screen for "no favourites yet" (first cut reuses the
  existing toast; noted as possible later polish).

## Context (current codebase)

- React + Vite + TypeScript, TanStack Query, Tailwind. No `localStorage` usage
  anywhere yet.
- Rooms have a stable `uuid` (`src/supabase/schema/types.ts`).
- Buildings render on `SpotMap`; selecting one opens `SidePanel` (desktop) or
  `BottomSheet` (mobile), both hosting `BuildingDetailContent`.
- `RoomCard` (`src/components/details/RoomCard.tsx`) renders category tags,
  note tags, name, capacity, timetable, and the "View Space" button. It is used
  for both building "Spaces" (via `RoomSection`) **and** library rooms (via
  `LibraryCard`), so a heart added here covers both.
- `LibraryCard` wraps its rooms in a container with an `onClick` that toggles
  expand/collapse — so the heart's handler must `stopPropagation()`.
- `FilterBar` renders chips from `useCategories()` and is single-select via
  `activeFilters.category`.
- `open_now` is already injected as a **client-side pseudo-category** in
  `useCategories` (`OPEN_NOW_CATEGORY`) — the precedent we follow for the
  Favourites chip.
- `useBuildings` applies filters in a `useMemo`: for a normal category it keeps
  only buildings containing a matching room and narrows each building's `rooms`
  and `library.rooms` arrays to matching rooms. The Favourites filter reuses
  this exact shape.

## Architecture

### 1. State layer

Chosen approach: **`useSyncExternalStore` over a framework-free store module**
(no React Context, no provider wiring; consistent across all consumers and
across tabs).

**`src/stores/favouritesStore.ts`**

- Holds an in-memory `Set<string>` of room uuids, seeded once from
  `localStorage` on module load.
- `getSnapshot()` returns a **stable reference** that is only replaced when the
  set actually changes, so `useSyncExternalStore` does not loop. (The snapshot
  is a `ReadonlySet<string>` / immutable value; `toggle` builds a new set.)
- Public API:
  - `subscribe(listener: () => void): () => void`
  - `getSnapshot(): ReadonlySet<string>`
  - `toggle(uuid: string): void`
  - `isFavourite(uuid: string): boolean`
- On every change: write the set to `localStorage` (as a JSON array) and notify
  listeners.
- Registers a window `storage` event listener so a change in another tab
  updates this tab's in-memory set and notifies listeners (cross-tab sync).
- **Storage key:** `ubseats:favourites`
- **Storage value:** JSON array of uuids, e.g. `["uuid-a","uuid-b"]`.
- All `localStorage` reads/writes wrapped in `try/catch`. On failure (private
  mode, quota, disabled storage, malformed JSON) the store falls back to an
  empty/in-memory set and the feature silently no-ops; the app never crashes.

**`src/hooks/useFavourites.ts`**

Thin wrapper exposing:

```ts
const { favourites, isFavourite, toggle } = useFavourites();
// favourites: ReadonlySet<string>
```

Implemented with `useSyncExternalStore(subscribe, getSnapshot)`. `isFavourite`
and `toggle` delegate to the store.

### 2. Heart toggle on `RoomCard`

**`src/components/details/FavouriteButton.tsx`** — a `<button>` rendering a
lucide `Heart`:

- Outline when not favourited; filled (`fill-current`, colour tied to the app's
  `primary`) when favourited.
- Props: `{ roomUuid: string; roomName: string }`. The component is
  self-contained — it reads `isFavourite` and calls `toggle` via
  `useFavourites` itself (`roomName` is used only for the `aria-label`). This
  keeps `RoomCard` unchanged beyond rendering the button.
- `onClick`: `e.stopPropagation()` then `toggle(roomUuid)`. The
  `stopPropagation` prevents the `LibraryCard` expand/collapse (and any future
  card-level nav) from firing.
- Accessibility: `aria-pressed={isFavourite}` and a descriptive `aria-label`
  (e.g. `"Add <room name> to favourites"` / `"Remove <room name> from
  favourites"`).

**Placement:** top-right of the card, in the header row alongside the
category/note tags (Option A), above the "View Space" button.

### 3. "Favourites" filter chip

Follows the `open_now` pseudo-category precedent:

- Add `'favourites'` to `CategoryType` in `src/supabase/schema/types.ts`.
- In `useCategories` (`src/hooks/useBuildings.ts`), inject a client-side
  `FAVOURITES_CATEGORY = { id: 'favourites', name: 'Favourites', icon: 'Heart',
  color: <primary> }`, placed **first** in the returned list so it leads the bar.
- Register `Heart` in `FilterBar`'s `ICON_MAP`.
- Selection stays **single-select**: choosing Favourites clears any active
  category and vice versa (existing `handleCategoryClick` behaviour, no change).

### 4. Filter logic in `useBuildings`

Add a `favourites` branch to the filter `useMemo`, mirroring the existing
per-room category branch but matching by `favourites.has(room.uuid)`:

- Keep only buildings that contain at least one favourited room (across
  `rooms` and `library.rooms`).
- Narrow each surviving building's `rooms` and `library.rooms` to just the
  favourited rooms.
- `useBuildings` reads the set via `useFavourites()` and includes `favourites`
  in the `useMemo` dependency array, so un-favouriting a room while the filter
  is active removes it from the list **live**.

## Data Flow

1. User taps the heart on a `RoomCard` → `FavouriteButton` calls
   `toggle(uuid)`.
2. `favouritesStore` updates its set, persists to `localStorage`, notifies
   subscribers.
3. `useSyncExternalStore` re-renders every consumer: the tapped card's heart
   fills/empties, and — if the Favourites filter is active — `useBuildings`
   recomputes and the map + panels update live.
4. On reload, the store re-seeds from `localStorage`; hearts render filled for
   persisted favourites.
5. In another open tab, the `storage` event updates the store and mirrors the
   change.

## Error Handling / Edge Cases

- **`localStorage` unavailable** (private mode, disabled, quota exceeded):
  reads/writes are caught; feature runs in-memory for the session and never
  throws.
- **Corrupt / non-array JSON** under the key: treated as an empty set.
- **Stale uuids** (room later removed from the DB): harmless — never matches,
  simply shows nothing.
- **No favourites + Favourites filter active**: building list is empty, so the
  existing "No buildings found — adjust your filters" toast fires. Left as-is
  for the first cut.

## Testing

The repo has no test runner configured (Vitest not wired up). Verification plan:

- **If a test setup is added:** pure-logic unit tests for `favouritesStore` —
  toggle add/remove, `localStorage` persistence round-trip, corrupt-JSON
  tolerance, stable-snapshot identity.
- **Manual verification (baseline):**
  - Favourite a room → heart fills.
  - Reload → heart still filled.
  - Favourites chip narrows the map and the side panel / bottom sheet.
  - Un-favourite a room while the Favourites filter is active → it disappears
    live.
  - Tapping the heart inside a library does **not** collapse the library.
  - Open a second tab → toggling in one reflects in the other.

## Files Touched

New:
- `src/stores/favouritesStore.ts`
- `src/hooks/useFavourites.ts`
- `src/components/details/FavouriteButton.tsx`

Modified:
- `src/supabase/schema/types.ts` — add `'favourites'` to `CategoryType`.
- `src/hooks/useBuildings.ts` — inject `FAVOURITES_CATEGORY`; add favourites
  filter branch.
- `src/components/FilterBar.tsx` — add `Heart` to `ICON_MAP`.
- `src/components/details/RoomCard.tsx` — render `FavouriteButton` top-right.

## Decisions Locked

- Icon: **heart** (outline → filled); fill colour ties to `primary`.
- Placement: **top-right** of the card (Option A).
- State: **`useSyncExternalStore`** over a plain store module (no Context).
- Filter chip: **single-select**, positioned **first** in the bar.
- Empty-favourites case: **reuse existing toast** (no custom empty state yet).
- Storage key: `ubseats:favourites`; value is a JSON array of uuids.
