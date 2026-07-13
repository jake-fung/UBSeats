# UBC Classrooms in UBSeats — Design

**Date:** 2026-07-13
**Status:** Approved design, pre-implementation

## Problem

Every general teaching space at UBC is a potential study spot when no class or event
is booked in it, but students have no easy way to know which classrooms are free.
UBC schedules these rooms through Scientia (Syllabus Plus) and publishes a public,
no-login weekly booking grid at the UBC Online Timetable
(https://sws-van.as.it.ubc.ca/). There is no API — only server-rendered HTML — so the
data must be scraped. The approach is proven: ubcclassrooms.ca
(https://github.com/JeffreyJPZ/ubc-classrooms) scrapes the same source.

Classroom "availability" is schedule inversion, not occupancy sensing: free time is
the complement of bookings within the timetable's 07:00–22:00 window.

## Scope

- **In scope:** general teaching spaces only (Scientia's "locations by zone" view,
  ~70 buildings). These are rooms students can realistically walk into.
- **Out of scope:** restricted (department-controlled) spaces; live occupancy;
  marker restyling for the denser map (follow-up if needed); app test suite
  (deliberately deferred project-wide — one scraper fixture test is the exception).

## Architecture

```
GitHub Actions (daily cron, ~04:00 Pacific, + workflow_dispatch)
  └─ scraper/ (TypeScript + Playwright)
       1. Load current academic-year Scientia URL, open "locations by zone"
       2. Select all classrooms, current + next week, all days, 07:00–22:00,
          submit form, parse returned HTML grid
       3. Map Scientia building names → bldg_code via checked-in alias map
       4. Write to Supabase (service-role key):
            - upsert rooms into building_rooms (idempotent natural key)
            - replace classroom_bookings rows for the scraped window
  └─ Supabase
       └─ fetchBuildings() (existing pipeline, +1 parallel query)
            └─ bookingsToSlots() → TimeSlot[] → computeDayBlocks()
                 └─ RoomTimetable / AvailabilityBadge / FilterBar (unchanged or near-unchanged)
```

## Data model (Supabase)

No changes to existing tables. Two additions:

### Rooms reuse `building_rooms`

- Each classroom is a normal room row, named `"<BLDG_CODE> - Room <number>"`
  (matches the existing convention, e.g. `"BUCH - Room A101"`).
- Linked to its building via `bldg_code` lookup — all 443 buildings already exist
  in the `buildings` table, so no building seeding is required.
- Tagged through `room_categories` with a new `'classroom'` row in `categories`.
- Upserts key on a new `source_key` text column on `building_rooms`
  (e.g. `"BUCH-A101"`, unique where not null) built from the natural key
  **building code + room number**, so re-scraping never duplicates rooms.
  Manually entered rows leave it null and are never touched by the scraper.

### New table `classroom_bookings`

| column       | type        | notes                                    |
| ------------ | ----------- | ---------------------------------------- |
| `id`         | uuid PK     | default `gen_random_uuid()`              |
| `room_uuid`  | uuid FK     | → `building_rooms.uuid`, cascade delete  |
| `starts_at`  | timestamptz | booking start                            |
| `ends_at`    | timestamptz | booking end                              |
| `title`      | text null   | course/event name if the grid shows one  |
| `scraped_at` | timestamptz | when this row was written                |

- Stores **bookings** (~2–6 per room per day), not expanded 15-minute slots
  (96 per room per day): ~50× less data at rest; the client inverts at read time.
- Each scrape **replaces** all rows in its window (current week + next) in a
  single transaction, so a failed scrape can never leave a half-written window.
- RLS: public (anon) read, service-role write — same posture as existing tables.

### Why not reuse `room_availability`

`room_availability` is a live-snapshot shape with a 30-minute staleness cutoff in
`fetchRoomAvailability()` (src/supabase/services/supabaseService.ts). It fits
LibCal-style "checked a moment ago" data. Classroom schedule data is valid for a
week; forcing it into that table means special-casing the staleness rule. Separate
tables keep both semantics clean.

## Scraper (`scraper/` directory)

- Top-level `scraper/` directory with its own `package.json` (Playwright and the
  Supabase admin client stay out of the app bundle's dependency tree).
- TypeScript throughout — shares no runtime code with the app, but may mirror the
  `TimeSlot`/booking shapes in its own types.
- Steps:
  1. Navigate to the Scientia URL for the current academic year. The year segment
     (e.g. `sws_2025/`) is a named constant in `scraper/config.ts`.
  2. Click the general-spaces view (`LinkBtn_locationByZone`), select all rooms,
     current + next week, all days, full period; request the grid report.
  3. Parse the HTML grid into raw bookings:
     `{ scientiaBuildingName, roomNumber, weekday, start, end, title? }`.
  4. Resolve `scientiaBuildingName` → `bldg_code` via a checked-in alias map
     (ported from ubc-classrooms' name enum, general-spaces subset). Unmatched
     names are collected and reported in the run summary — they fail the run
     loudly rather than being silently dropped.
  5. Upsert rooms, then replace `classroom_bookings` for the window.
- **Schedule:** GitHub Actions cron daily at ~04:00 Pacific (11:00/12:00 UTC
  depending on DST — pick one UTC time and accept the hour drift), plus
  `workflow_dispatch` for manual runs.
- **Secrets:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` as repository secrets.
  The service-role key never appears in client code or `.env` for the app.

## Frontend changes

- `CategoryType` (src/supabase/schema/types.ts) gains `'classroom'`;
  `validateCategoryType` (src/utils/spotUtils.ts) accepts it; a new row in the
  `categories` table (name "Classroom", icon, color) makes the existing
  `FilterBar` chip and category filtering work with no new UI code.
- `fetchBuildings()` adds one parallel query for `classroom_bookings` and attaches
  per-room booking lists to the assembled `Room` objects.
- New util `bookingsToSlots(bookings, date)` (src/utils/hoursUtils.ts or a sibling
  file): inverts a room's bookings within the 07:00–22:00 window into
  15-minute-aligned `TimeSlot[]` — the exact shape `computeDayBlocks()` consumes.
  Outside 07:00–22:00 the room reads as `closed`; booked intervals read as
  `unavailable`; the rest as `available`.
- `RoomTimetable` renders classroom schedules **unchanged**. `AvailabilityBadge`
  ("free until 2:00pm") computes from the same slots.
- Map: buildings that previously had no rooms now pass the
  `rooms.length > 0` filter in `fetchBuildings()` and get markers (~60–70 new).
  The existing category filter shows/hides them; marker restyling for density is
  an explicit follow-up, not in this scope.

## Error handling & freshness

- Scrape failure → the GitHub Action fails loudly (GitHub notification email);
  existing data stays in place and degrades gracefully — schedule data remains
  valid for its scraped window.
- Academic-year URL rollover (`sws_2025/` → `sws_2026/`) breaks the scrape
  **visibly** (navigation/selector failure) instead of silently writing nothing;
  fixing it is a one-constant change in `scraper/config.ts`.
- Page-structure changes are caught the same way: selectors fail → run fails.
- `scraped_at` supports an optional "schedule updated daily" note in the UI later.

## Testing

- The HTML-grid **parser** is the brittlest unit: it gets a fixture test — a saved
  Scientia grid response page checked into `scraper/fixtures/` and a test that
  asserts the parsed booking list. Runs in the scraper's own CI job.
- No app-side test suite is added (consistent with the project's deferred-testing
  stance).
- Manual verification: run the scraper against live Scientia once, then check a
  handful of rooms in the app against the timetable site by eye.

## Rollout

1. Build and verify everything locally first (scraper dry-run mode that writes
   JSON to disk instead of Supabase).
2. Batch all live-project changes into **one explicit approval ask**: migration
   for `classroom_bookings` (+ `source_key` column if used), `'classroom'`
   category row, RLS policies, GitHub repository secrets, first live scrape.
3. After the first live scrape, verify in the deployed app before announcing.
