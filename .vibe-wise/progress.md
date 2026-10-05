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
- Learner approved steps 2-4 (deploy, migrate, manual run), then INTERRUPTED before any deploy to ask
  whether production (main) and 1.2 stay working. Nothing live was changed.
- Correction logged: Claude earlier said the day picker doesn't read stored hours. Wrong: 1.2's
  HoursPill highlights `useSelectedDate().getDay()`, so a next-week date shows this week's stored
  hours for that weekday (holidays bleed into / are missing from next week). main has no day picker.
- Verified safe for schema: views list explicit columns, no FKs/triggers on hours rows, select *
  ignores extra columns, missing days already render "Closed" in main + 1.2, IKBLC 06:00-00:00
  already in prod. Data change: 8 of 9 targets get different (site-accurate) hours; Research
  Commons gains hours; IKBLC unchanged this week.
- Stage: awaiting learner decision on the 1.2 next-week mismatch before going live.
- Learner proposal: add a column on building_hours storing which week the hours belong to.
  Claude raised: venue_hours holds 7 of 9 targets; unique (building_uuid, day_of_week) blocks a
  second week; main picks hours by day_of_week only, so multiple weeks of rows would show wrong
  hours in production; rows for the other 47 hand-entered buildings have no week. Awaiting
  learner on purpose (label only vs store this + next week) and how each build reads it.
- Learner decision: store THIS week and NEXT week (14 days), week column on venue_hours too.
- Still open (asked): how main avoids mixing two weeks of rows (main ignores the column; learner
  has expand/contract precedent from venues), week value representation, and whether an
  unresolvable next week fails the whole branch (period ends e.g. Dec 22 now fail a week earlier).
- Learner decisions: use expand/contract to keep main working; if next week can't resolve, save
  this week alone; week value = week-start Sunday (date).
- Open (asked): concrete expand shape (what main reads / what 1.2 reads / what sync writes /
  what contract removes), given main reads `building_hours` + `venue_hours` by name with select *;
  and the week value for the hand-entered, never-synced rows.
- Learner asked Claude to design the expand/contract shape ("design it for me"). Claude's PROPOSAL
  (not a learner decision): new tables building_hours_by_week / venue_hours_by_week (week_start
  Sunday date); old tables untouched in shape, sync keeps writing this week there during expand
  (main unchanged); 1.2 reads by-week rows for synced owners, old rows for hand-entered owners;
  missing synced week -> "hours not published" in 1.2 (changes keep-old behaviour for 1.2 only);
  next-week failure not alerted; contract = stop dual write + delete synced rows from old tables.
  Alternative considered: rename + compat views (rejected: empty hours in main if sync fails).
- Design checkpoint: learner chose "Confirm and continue" on Claude's proposal (2026-10-04).
  Earlier approval of live steps 2-4 was for the previous design; needs re-approval.
- Implementation checkpoint CONFIRMED for two-week revision (incl. backup table, local-day week
  basis, migrate-before-1.2-ships).
- Learner committed v1 as 774b5c2 ("library hours pipeline") before the revision.
- IMPLEMENTED two-week revision locally (uncommitted): migration rewritten (backup table,
  *_hours_by_week tables + RLS read policy, RPC (kind,id,this_week_start,this_rows,next_rows),
  dual-write marked for contract); parseHours calendarWeeks/resolveWeeks; index.ts best-effort next
  week; 1.2 frontend: by-week types, supabaseService hoursByWeek, hoursUtils weekStartOf/
  hoursForDate/hasAnyHours, HoursPill owner prop + "Hours not published yet", status/open filter
  use today's week.
  Verified: 19 deno tests, deno check, app tsc, eslint (1 pre-existing warning), vite build, live
  read-only dry run for weeks of Oct 4 and Dec 13. NOT verified: migration SQL, RPC, cron, email,
  1.2 UI in browser (needs migration; 1.2 dev against prod DB fails until migrated).
- Learner approved go-live steps 1-4. Step 1 DONE: sync-library-hours v1 deployed (verify_jwt true).
  Step 2 apply_migration call was DECLINED at the tool prompt; migration NOT applied. Steps 3-4
  not run. Deployed function is inert (no cron; loadTargets would 500 on missing columns, no writes).
- Stage: awaiting learner on how to proceed with the migration.
- Previously next: learner approval for live steps (apply migration, deploy function, Resend account +
  secrets), then System check.

## Classroom scraper
- Introduced (Claude explained): bookings are inverted to availability; the read side's coverage
  guard (global latest scraped_at → two-week window); LibCal uses a 30-min age check instead.
