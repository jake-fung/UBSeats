# Project Map

## Purpose
UBSeats (ubseats.ca): a map of UBC Vancouver study spaces, venues, and classrooms showing
which rooms are free now / on a chosen day. React + Vite frontend reading from Supabase.

## Requirements
- Show live-ish availability for bookable library/AMS rooms (LibCal) and general
  teaching classrooms (UBC Scientia timetable).
- Day picker covers the rest of this week + next week (two-week window).
- Learner's current interest: understanding the web scraping that feeds availability.

## Components
Verified from code (2026-10-04):

1. Classroom scraper — `scraper/` (Node, Playwright, run locally by hand)
   - `src/index.ts` CLI entry: flags `--headed`, `--capture`, `--live`
   - `src/scrape.ts` drives a real Chromium through Scientia's ASP.NET form
     (CWL/F5 gate, AutoPostBack dropdowns, `showtimetable.aspx` report), this + next week
   - `src/parseGrid.ts` parses the "List Timetable" HTML (node-html-parser) → RawBooking
   - `src/transform.ts` + `aliasMap.ts` map location text → bldg_code/room, weekday+time → UTC
   - `src/roomSyncPlan.ts` + `supabaseWriter.ts` match/insert rooms, then RPC
     `replace_classroom_bookings` (delete window, insert fresh set)
   - Tests: `*.test.ts` via node:test
2. LibCal sync — `supabase/functions/sync-libcal-availability/` (Deno Edge Function)
   - `index.ts` reads `building_rooms.link`, classifies LibCal rooms
   - `roomSync.ts` batches rooms (CONCURRENCY 4, 500 ms delay), upserts `room_availability`
   - `libcalClient.ts` scrapes lid/gid from the space page HTML (regex), then POSTs
     LibCal's internal `/spaces/availability/grid` JSON endpoint; shares one grid per group
     per run; converts naive Vancouver timestamps to UTC
   - `parseAvailability.ts` computes isAvailableNow / availableUntil / nextAvailableAt; mergeSlots
2b. Library hours sync (local, NOT deployed as of 2026-10-04) — `supabase/functions/sync-library-hours/`
   - Weekly (pg_cron Sun 08:30 UTC, in migrations-pending). Reads venues/buildings.library_branch,
     fetches hours.library.ubc.ca month fragments, resolves this + next Sun-Sat week per branch,
     RPC `replace_library_hours` writes *_hours_by_week (both weeks, 1.2 reads) and the legacy
     one-row-per-weekday *_hours (this week, main reads) — expand phase; this-week failure keeps
     old rows + Resend email; next-week failure only logged.
   - 1.2 read side: `hoursForDate(owner, date)` in hoursUtils picks the week's synced rows, else
     hand-entered weekly rows; null = "Hours not published yet".
3. Frontend read side — `supabase/services/supabaseService.ts`, `src/hooks/useRoomAvailability.ts`
   (react-query refetchInterval)

## Main Flow
```
Scientia (CWL-gated HTML) --Playwright, manual run--> parseGrid --> transform
   --service_role RPC--> classroom_bookings  --read + invert--> frontend
LibCal space page --regex lid/gid--> /spaces/availability/grid (JSON)
   --> mergeSlots/parseAvailability --upsert--> room_availability --read--> frontend
Trigger for the Edge Function: ? (not in repo)
```

## Data and Trust Boundaries
- Scraper writes with SUPABASE_SERVICE_ROLE_KEY from `scraper/.env` (gitignored).
- CWL session cookie persisted in `scraper/.auth/state.json`.
- Edge Function uses service role from Supabase env.
- External sources: sws-van.as.it.ubc.ca (auth + campus/VPN), libcal.library.ubc.ca,
  amsubc.libcal.com (public, requires Referer, throttles bursts).

## Build and Deployment
- Frontend: `npm run dev` / `npm run build` (Vite); deployed on Vercel (per memory notes).
- Scraper: `cd scraper && npm run scrape [-- --live|--headed]`, `npm run test`.
- Edge Function: Deno; deployment via Supabase.

## Unknowns
- (Resolved 2026-10-04) `sync-libcal-availability` is scheduled by pg_cron job 1, every 15 min,
  via `net.http_post` using vault secrets `project_url` + key. Not defined in repo migrations.
- RLS policies on classroom_bookings / room_availability (not inspected).
