# UBSeats classroom-availability scraper

Scrapes UBC's Scientia **"List Timetable"** (General Teaching Spaces) for the current
and next week of classroom bookings, then writes them to Supabase. The app derives
each classroom's live availability by **inverting** these bookings — a room with no
booking right now reads as free.

- **Source:** `https://sws-van.as.it.ubc.ca/sws_2025/` (CWL + campus-gated)
- **Sink:** Supabase `classroom_bookings` (+ auto-inserts new rooms into `building_rooms`)
- **Runs:** locally, on demand. There is **no cloud cron** — Scientia requires CWL, so
  it can't run from CI.

## Prerequisites

1. **Be on UBC campus Wi-Fi or the UBC VPN.** Scientia sits behind an F5/CWL gate;
   an off-campus headless run fails immediately with a clear error.
2. **Create `scraper/.env`** (required for `--live` DB writes):
   ```
   SUPABASE_URL=https://rhtqhrlaaibyxkatzbkn.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<secret service_role key>
   ```
   Use the **service_role** key (not the anon key), from Supabase → Project Settings →
   API. It has full DB access — keep it out of git (`.env` is gitignored).
3. **Install deps** (first time, or after clearing `node_modules`):
   ```bash
   cd scraper
   npm install
   npx playwright install chromium
   ```

## Refreshing the data

```bash
cd scraper

# 1) Dry run — writes out/bookings.json + out/summary.json, NO DB changes
npm run scrape

# 2) If it errors at the CWL/F5 gate (saved session expired), log in once:
npm run scrape -- --headed     # complete CWL + Duo in the browser; refreshes .auth/state.json

# 3) Go live — scrapes AND writes to Supabase
npm run scrape -- --live
```

**Always dry-run first** and check `out/summary.json` for `"unmatchedLocations": []`.
If that array is non-empty, the run **fails loudly and writes nothing** — resolve the
locations first (see Troubleshooting).

### What `--live` does

1. Loads `buildings` + `building_rooms`; plans a room sync: matches scraped rooms by
   `source_key`, auto-inserts genuinely new rooms as `classroom`-tagged, and skips
   hand-entered/library rooms (protects the IBLC LibCal rooms from duplication).
2. Calls the `replace_classroom_bookings(p_window_start, p_window_end, p_rows)` RPC,
   which **deletes bookings overlapping the scrape window, then inserts the fresh set**.
   This is idempotent — re-running is safe.
3. Prints a summary, e.g.
   `LIVE: wrote 3560 bookings; matched 328 rooms, inserted 0, skipped manual 0`.

You do **not** redeploy the frontend after a refresh — the app refetches availability
every 90s and picks up the new rows automatically.

### Verifying

- Watch the `LIVE:` line for the counts.
- `select count(*), max(scraped_at) from classroom_bookings;`
- Or just open <https://ubseats.vercel.app/>.

## Auth model

Playwright stores the CWL session at `.auth/state.json` and reuses it on the next run.
When the session expires, a headless run hits the gate and errors; re-run with
`--headed` and complete CWL (including Duo) in the browser window — the refreshed
session is saved back automatically.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `Hit the UBC CWL/F5 gate` | Not on campus/VPN, or session expired. Get on the network; re-run with `--headed` to log in. |
| `FAILED: N unmatched Scientia locations` | A Location cell didn't parse to `<CODE> <room>`. Add a mapping in `src/aliasMap.ts`, or list it in `UNMAPPABLE_LOCATIONS` in `src/config.ts` after review. The run exits 1 and writes nothing. |
| Navigation fails / selectors missing | Likely the academic-year rollover. Bump `ACADEMIC_YEAR_SEGMENT` in `src/config.ts` (e.g. `sws_2025` → `sws_2026`). |
| `SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set` | `scraper/.env` missing or incomplete (see Prerequisites). |

## Other scripts

```bash
npm run capture     # save Scientia HTML fixtures (--capture --headed) for parser tests
npm run test        # node:test suite (aliasMap / parseGrid / transform / roomSyncPlan)
npm run typecheck   # tsc --noEmit
```

## Known gap: faculty-scheduled rooms

Five rooms exist in the DB as classrooms but are **not** in Scientia's central scheduler,
so a scrape never produces bookings for them and they read as always-available:

- **MUSC 113 / 116 / 201** — scheduled by the School of Music.
- **ANGU 491 / 492** — Sauder lecture theatres, booked via `booking.sauder.ubc.ca`.

Suppressing their live-availability display is a known, deferred to-do (a read-side skip
in `fetchClassroomAvailability`).
