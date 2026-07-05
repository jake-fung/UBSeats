# LibCal Room Availability — Design Spec

## Goal

Show live "available now" / "busy until X" status on `RoomCard` for the subset of bookable rooms whose booking link points at UBC's LibCal system (Springshare), replacing the current static-only room display for that subset.

## Background & feasibility findings

Of the 201 rooms with a `link`, three booking backends account for nearly all of them:

| Domain | Rooms | Live availability? |
|---|---|---|
| `learningspaces.ubc.ca` | 67 | No — static info page only (capacity/description/wayfinding link). Confirmed via direct fetch; not a booking system at all. |
| `booking.sauder.ubc.ca` (MRBS) | 37 | Yes, server-rendered day-view HTML grid, no JSON API. Out of scope for this spec. |
| `libcal.library.ubc.ca` + `amsubc.libcal.com` (Springshare LibCal) | 51 | Yes. Confirmed via inspection of the page's shipped JS: it renders a FullCalendar widget wired to a function `timeGridRoomFetchEventsForTimePeriod(start, end, itemId, locationId, groupId, itemId)`. The exact HTTP request that function issues is assembled at runtime and isn't visible in the static JS bundles — confirming it requires a browser DevTools capture (Task 3 below), not something resolvable by static file inspection. |

**Scope for this spec: LibCal rooms only** (~51 rooms). Sauder/MRBS and crowd-sourced check-ins are explicitly out of scope — natural follow-ups if this proves valuable, not part of this design.

## Data model

New table, `room_availability`, one row per LibCal room (rooms elsewhere have no row — treated identically to today's "no data" case):

```sql
create table room_availability (
  room_uuid uuid primary key references building_rooms(uuid) on delete cascade,
  is_available_now boolean not null,
  available_until timestamptz,
  next_available_at timestamptz,
  checked_at timestamptz not null default now()
);

alter table room_availability enable row level security;

create policy "Enable read access for all users"
  on room_availability for select
  to public
  using (true);
```

No column is added to `building_rooms`. The LibCal space ID and host are parsed at fetch time from the existing `link` column (pattern: `https://{host}/space/{id}`), so there's one source of truth, not two.

## Architecture / pipeline

```
pg_cron (every 15 min)
  → net.http_post → Edge Function `sync-libcal-availability`
      → reads building_rooms where link matches a LibCal host
      → for each room: fetch LibCal slots for today (small concurrency cap, short delay between batches)
      → parseAvailability(slots, now) → { isAvailableNow, availableUntil, nextAvailableAt }
      → upsert into room_availability
  → frontend polls room_availability via its own TanStack Query key (`['room-availability']`,
    refetchInterval ~90s), independent of the existing `['buildings']` query, and merges by room_uuid
    at the point RoomCard is rendered.
```

15-minute cadence is deliberately coarse: bookings are 30-60 min blocks, so sub-minute precision isn't meaningful, and it keeps load on LibCal's shared infrastructure trivially light (~51 requests every 15 min, rate-limited client-side).

## Error handling & staleness

- A failure fetching or parsing one room's slots is caught **per room** and logged; it must not abort the batch for the other ~50 rooms.
- `checked_at` drives staleness: the frontend ignores any row older than 30 minutes (≈2 missed cycles) and renders no badge, rather than a confidently wrong one. If LibCal changes its markup and every room starts failing, the visible symptom is "badges disappear," diagnosable via Edge Function logs — not "badges lie."
- Availability is an enhancement, not a dependency: if the `room_availability` fetch fails client-side, the room list renders exactly as it does today, just without badges.

## Frontend integration

- `Room` type gains an optional `availability?: RoomAvailability | null` field populated at render time from a separate lookup map — not merged into `fetchBuildings()`'s existing `Building[]` tree, so the static 9-query fetch is untouched.
- New `fetchRoomAvailability()` in `supabaseService.ts`, new `useRoomAvailability()` hook with `refetchInterval: 90_000`, called once from `BuildingDetail`.
- New `AvailabilityBadge` component (in `src/components/details/`, alongside `NoteTags`/`CapacityRow`), rendered in `RoomCard` only when availability data is present.

## Non-goals

- Sauder/MRBS scraping, crowd-sourced check-ins, Supabase Realtime push, and open (non-bookable) study-area occupancy are all explicitly out of scope for this spec.
- No new automated test framework for the frontend (matches this project's existing, deliberate decision to defer that investment). The one exception is the pure `parseAvailability` function, exercised via Deno's built-in test runner (`deno test`) scoped entirely to the new Edge Function code — zero new npm dependencies, zero change to the frontend's test posture.
