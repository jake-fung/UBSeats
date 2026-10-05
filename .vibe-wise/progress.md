# Learning Progress

## Pending decision
- Decision: classroom staleness definition and handling (Build checkpoint), stage: awaiting reasoning.
- Requirement stated by learner: address classroom-data staleness; missing data must not show as free.
- Verified 2026-10-04: missing-coverage already renders as no timetable (not free) via
  `classroomWindowCoversDate` (scrape-week Monday + 14d) → `loadClassroomDay` returns null →
  RoomDetails hides RoomTimetable. Gaps: no age check within window; no explicit "unknown/stale" UI state.
- Awaiting: learner's definition of "too stale" and what should happen (refresh mechanism, UI, or both).
- Update: learner asked whether the scraper can auto-run every few days (leaning toward a refresh
  mechanism). Claude explained the gates: scheduler (launchd), campus network/VPN, server-side
  session-only Scientia cookies (expiry server-controlled, likely short; unverified), Duo
  remembered-browser cookies expiring 2026-10-17. Unattended login would require storing the CWL
  password (trust-boundary decision). Now awaiting: target automation level, which steps keep a
  human, and how failures/staleness get noticed.
- DB facts (2026-10-04): last scrape 2026-09-28 18:42 PDT; coverage ends 2026-10-12 local; 37,105
  rows back to 2026-08-17 (replace RPC deletes only the scrape window, so old weeks accumulate).
- Correction logged: Claude initially claimed uncovered days would read as free; that was wrong.

## Building hours pipeline
- Requirement stated by learner (2026-10-04): a pipeline to fetch hours for each library and building.
  (Classroom staleness decision above remains pending, parked while this is discussed.)
- Verified current state: `building_hours` (315 rows, 56 of 443 buildings) and `venue_hours`
  (88 rows, 13 of 18 venues); schema is weekly recurring (day_of_week, opens_at, closes_at),
  no date-specific exceptions. No code in repo populates them (no pipeline exists).
  Read side: `supabaseService.ts` buildHoursMap → `hoursUtils.ts` getBuildingStatus/isBuildingOpenNow.
- Learner's approach (2026-10-04): sources = hours.library.ubc.ca for libraries,
  learningspaces.ubc.ca find-a-space building page for buildings; runs weekly; each run replaces
  building hours; on failure, old hours stay.
- Source facts verified by Claude (2026-10-04):
  - Library page: static server-rendered HTML; per branch `section.hours-table` with
    "Regular Hours (Sep 1-Dec 22)" day-range rows (Mon-Thu 9am - 9pm, "Closed*") plus dated
    Holiday/Exception rows (e.g. Oct 12 Closed). 19 branches incl. Okanagan/virtual.
    Libraries live in `venues` (kind=library, 7 rows), not buildings.
  - Learning Spaces: React page; data via POST admin-ajax.php action=find_a_space_building
    {campus, formal, slug} + WordPress `_nonce` scraped from the page; returns HTML with
    `div.building-hours`. Building list (action=find_a_space_buildings) = 42 buildings (vs 443 in DB);
    no slug field, slug derived from name+code. DB has no learning-spaces link column; bldg_code matches.
  - Hours text is free-form: most "M-F: 7:30am - 5pm"; irregular: GWHB (multi-section),
    LIFE (winter/summer, stale 2025 dates), ORCH (sentence), OSB1/SPPH empty.
- Learner decisions (2026-10-04, not yet confirmed at a Design checkpoint):
  - Store this week's ACTUAL hours, holidays included (not the regular schedule).
  - Run on Supabase like the LibCal pipeline (Edge Function + pg_cron).
  - Failure granularity / what counts as failure: learner answered "?" (unsure).
- Verified: pg_cron job 1 `sync-libcal-availability` runs */15 via net.http_post with vault secrets.
  Stored hours are only used for "now" status + HoursPill weekly table (BuildingDetailContent,
  VenueCard, useBuildings), not for future days in the day picker.
- Claude flagged: with actual-week semantics, keep-old-on-failure carries last week's holidays forward.
- Claude gave the failure option space (granularity table, failure kinds).
- SCOPE CHANGE (learner, 2026-10-04): libraries only for now; Learning Spaces buildings deferred
  because learner suspects that data is not up to date (consistent with LIFE's 2025 dates).
- Verified mapping facts: library branches land in two places today. venues(kind=library): Asian
  (ACEN), David Lam (DLAM), Law (ALRD), MAA (IBLC), Research Commons (KLIB, 0 hrs), Woodward (IRC),
  Xwi7xwa (FNLH). building_hours: KLIB (Koerner bldg, 7 rows), IBLC (IKB bldg, 7 rows). Site
  branches not in DB: Chapman, Biomedical, Gallery, RBSC, Archives, Okanagan x3, AskAway.
  No column links a venue/building to a library-site branch id.
- Learner decisions: skip unmatched branches; on failure keep old hours PER BRANCH.
- Learner decisions: mapping lives in a DB column; alert when a branch's hours are stale.
- Verified: any month is fetchable via POST hours.library.ubc.ca/includes/calendar.inc.php
  {location_id (numeric, from prev/next button value), year, month}; holiday rows can be ranges
  ("Dec 23-24"); dates outside the regular period are covered by holiday rows.
- Claude presented proposed additions (columns on venues+buildings, per-branch atomic replace RPC,
  per-branch synced-at timestamp, Sunday run window, parse rules). Open: alert channel + threshold.
- Learner decisions: alert by email; a branch is stale after missing one weekly run.
- Claude flagged: an email sent by the sync run itself can't report that the run never happened
  (cron/function dead).
- Learner decision: not covering "run never happens"; the alert is sent from within the sync run.
- Implementation checkpoint CONFIRMED 2026-10-04 ("Implement this step"), incl. proposed
  additions (Resend, 08:30 UTC Sunday, holiday overrides regular, no-rule date fails branch,
  stale = synced_at < run start, email on page-fetch failure). Scope: local code only, no deploy.
- IMPLEMENTED locally 2026-10-04 (uncommitted, not deployed):
  `supabase/migrations-pending/2026-10-04-library-hours.sql` (columns, mapping seed w/ count
  assertion, replace_library_hours RPC service_role-only, pg_cron '30 8 * * 0');
  `supabase/functions/sync-library-hours/` (parseHours.ts, libraryClient.ts, alertEmail.ts,
  index.ts, deno.json, parseHours.test.ts); schema types venues.ts/buildings.ts.
  Deviation from checkpoint: every month (incl. current) fetched via calendar.inc.php; main page
  used only for branch ids. Claude-added rules: narrowest overlapping weekly block wins; unlisted
  weekday / conflicting dated rows / two intervals per day fail the branch; week = 7 days from
  the run's Vancouver date.
  Verified: 14 deno tests pass; deno check ok; eslint + app tsc clean; read-only live dry run
  parsed all 9 branches for weeks of Oct 4, Oct 11 (Thanksgiving), Dec 20.
  Not verified: migration SQL (not applied), email send, RPC, cron.
- Next: learner approval for live steps (apply migration, deploy function, Resend account +
  secrets), then System check.

## Classroom scraper
- Introduced (Claude explained): bookings are inverted to availability; the read side's coverage
  guard (global latest scraped_at → two-week window); LibCal uses a 30-min age check instead.
