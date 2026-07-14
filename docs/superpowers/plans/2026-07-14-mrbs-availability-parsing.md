# MRBS (Sauder Booking) Availability Parsing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing room-availability sync Edge Function so it also parses live availability for the Sauder rooms booked through MRBS (`https://booking.sauder.ubc.ca/ugr/` and `.../clc/`), alongside the LibCal rooms it already supports.

**Architecture:** MRBS has no JSON API — its day view is an HTML table where a booking spans multiple half-hour rows via `rowspan`, but conveniently embeds a `data-slots` attribute with the exact UTC instant boundaries for every row. A new `mrbsClient.ts` fetches that table once per (site, date) — cached, since one fetch returns every room's availability for that site — and reconstructs each room's `Slot[]` by walking the table as a grid. Because every room at a given MRBS site shares one identical `link` in `building_rooms` (unlike LibCal, where the link already embeds a room-specific space id), rooms are matched to MRBS columns at runtime by comparing the trailing code token of `room_name` (e.g. `"092"` in `"ANGU – Room 092"`) against the MRBS header label's trailing token (`"HA 092"`) — no database writes required. `index.ts`'s room-processing logic is extracted into a new `roomSync.ts` so it can classify a room as LibCal- or MRBS-sourced and dispatch to the matching fetcher, funneling both into the existing, unchanged `parseAvailability` + upsert path.

**Tech Stack:** Deno Edge Function (existing), `jsr:@supabase/supabase-js@2` (existing), `jsr:@std/assert` for tests (new, matches the convention already established for `parseAvailability.ts`).

**Full design context:** established via interactive brainstorming this session (no separate spec doc — scope is contained to the two new/modified files below, no schema changes). Supersedes the explicit "do not touch Sauder/MRBS" exclusion in `docs/superpowers/plans/2026-07-05-libcal-room-availability.md`'s Global Constraints — that exclusion was a deliberate scope cut for the original plan, not a permanent one.

## Global Constraints

- Scope is both Sauder MRBS sites already referenced in `building_rooms`: `https://booking.sauder.ubc.ca/ugr/` (~23 rooms) and `https://booking.sauder.ubc.ca/clc/` (~14 rooms). Do not touch LibCal rooms' behavior.
- No schema or migration changes. `room_availability`'s columns and the upsert shape are unchanged.
- No writes to `building_rooms.link` or any other table — MRBS room resolution happens entirely at request time via name-matching, cached in-memory per Edge Function instance.
- Deploying the edge function to Supabase is a separate, explicit, user-approved step per this project's standing convention — this plan only touches local source files and local `deno test` runs, no `mcp__supabase__deploy_edge_function` call.
- Tests use Deno's built-in test runner (`deno test`) and `jsr:@std/assert`, scoped entirely to this Edge Function's source — no change to the npm/Vite frontend, which still has no test suite.
- Known, accepted limitation carried over unchanged from LibCal (documented in `docs/superpowers/plans/2026-07-09-libcal-availability-follow-ups.md`, item 1): when "now" falls outside the fetched day's slot coverage, `parseAvailability` reports available-now by default. MRBS's day view only covers roughly 7:00–22:30, so the same false-positive applies overnight. Not fixed here — same accepted tradeoff as LibCal, not a new regression.
- Concurrency stays at the existing cap of 4 in-flight requests per batch (`CONCURRENCY` in `roomSync.ts`). MRBS rooms sharing a site benefit from the per-(site, date) page cache, so only the first MRBS room processed per site per invocation triggers an HTTP fetch.

---

## File Structure

New files:
- `src/supabase/functions/mrbsClient.ts` — MRBS day-table fetch, HTML parsing, and room-code resolution
- `src/supabase/functions/mrbsClient.test.ts` — Deno tests for the above
- `src/supabase/functions/roomSync.ts` — source-agnostic room classification, dispatch, batching, and upsert (extracted and generalized from the LibCal-only logic that used to live directly in `index.ts`)
- `src/supabase/functions/roomSync.test.ts` — Deno test for `classifyRooms`

Modified files:
- `src/supabase/functions/index.ts` — becomes a thin `Deno.serve` entrypoint; now also selects `room_name` and delegates classification/processing to `roomSync.ts`

Unchanged:
- `src/supabase/functions/parseAvailability.ts` — already operates on generic `Slot[]`, agnostic to source
- `src/supabase/functions/libcalClient.ts` — untouched

---

### Task 1: MRBS room-header and day-table parsing (pure, unit-testable)

**Files:**
- Create: `src/supabase/functions/mrbsClient.ts`
- Create: `src/supabase/functions/mrbsClient.test.ts`

**Interfaces:**
- Consumes: `Slot` type from `src/supabase/functions/parseAvailability.ts`.
- Produces: `extractRoomCode(name: string): string`, `parseMrbsPage(html: string): MrbsPage`, and the `MrbsRoomColumn`/`MrbsPage` types — consumed by Task 2 (same file) and exercised directly by this task's tests.

- [ ] **Step 1: Write the failing tests**

Create `src/supabase/functions/mrbsClient.test.ts`:

```ts
import { assertEquals, assertThrows } from "jsr:@std/assert";
import { extractRoomCode, parseMrbsPage } from "./mrbsClient.ts";

const FIXTURE_HTML = `
<table class="dwm_main" id="day_main" data-resolution="1800">
<thead data-slots="[[[1784037600,1784039400],[1784039400,1784041200],[1784041200,1784043000]]]" data-timeline-vertical="false" data-timeline-full="true">
<tr>
<th class="first_last">Time</th>
<th data-room="101"><a href="index.php?view=week&amp;view_all=0&amp;year=2026&amp;month=07&amp;day=14&amp;area=1&amp;room=101" title = "View Week

Test Room">HA 001<span class="capacity">4</span></a></th>
<th data-room="102"><a href="index.php?view=week&amp;view_all=0&amp;year=2026&amp;month=07&amp;day=14&amp;area=1&amp;room=102" title = "View Week

Test Room">HA 002<span class="capacity">4</span></a></th>
</tr>
</thead>
<tbody>
<tr>
<th data-seconds="25200"><a href="index.php?view=day&amp;year=2026&amp;month=07&amp;day=14&amp;area=1&amp;room=101&amp;timetohighlight=25200" title="Highlight this line">07:00</a></th>
<td class="new"><a href="edit_entry.php?view=day&amp;year=2026&amp;month=07&amp;day=14&amp;area=1&amp;room=101&amp;hour=7&amp;minute=0" aria-label="Create a new booking"></a></td>
<td class="new"><a href="edit_entry.php?view=day&amp;year=2026&amp;month=07&amp;day=14&amp;area=1&amp;room=102&amp;hour=7&amp;minute=0" aria-label="Create a new booking"></a></td>
</tr>
<tr>
<th data-seconds="27000"><a href="index.php?view=day&amp;year=2026&amp;month=07&amp;day=14&amp;area=1&amp;room=101&amp;timetohighlight=27000" title="Highlight this line">07:30</a></th>
<td class="booked" rowspan="2"><div class="I booking multiday_start multiday_end"><a href="view_entry.php?view=day&amp;year=2026&amp;month=07&amp;day=14&amp;area=1&amp;id=1" title="Test User &lt;test@example.com&gt;" class="I" data-id="1" data-type="I">Test Booking</a></div></td>
<td class="new"><a href="edit_entry.php?view=day&amp;year=2026&amp;month=07&amp;day=14&amp;area=1&amp;room=102&amp;hour=7&amp;minute=30" aria-label="Create a new booking"></a></td>
</tr>
<tr>
<th data-seconds="28800"><a href="index.php?view=day&amp;year=2026&amp;month=07&amp;day=14&amp;area=1&amp;room=101&amp;timetohighlight=28800" title="Highlight this line">08:00</a></th>
<td class="new"><a href="edit_entry.php?view=day&amp;year=2026&amp;month=07&amp;day=14&amp;area=1&amp;room=102&amp;hour=8&amp;minute=0" aria-label="Create a new booking"></a></td>
</tr>
</tbody>
</table>
`;

Deno.test("extractRoomCode takes the trailing whitespace-separated token", () => {
  assertEquals(extractRoomCode("ANGU – Room 092"), "092");
  assertEquals(extractRoomCode("ANGU – Room 191A"), "191A");
  assertEquals(extractRoomCode("DLAM – CLC Room 202"), "202");
});

Deno.test("extractRoomCode throws on blank input", () => {
  assertThrows(() => extractRoomCode("   "), Error, "Could not extract a room code");
});

Deno.test("parseMrbsPage reads room headers in column order", () => {
  const page = parseMrbsPage(FIXTURE_HTML);
  assertEquals(page.rooms, [
    { roomId: "101", code: "001" },
    { roomId: "102", code: "002" },
  ]);
});

Deno.test("parseMrbsPage reconstructs slots across a rowspan-ed booking", () => {
  const page = parseMrbsPage(FIXTURE_HTML);

  assertEquals(page.slotsByRoomId.get("101"), [
    { start: "2026-07-14T14:00:00.000Z", end: "2026-07-14T14:30:00.000Z", available: true },
    { start: "2026-07-14T14:30:00.000Z", end: "2026-07-14T15:30:00.000Z", available: false },
  ]);

  assertEquals(page.slotsByRoomId.get("102"), [
    { start: "2026-07-14T14:00:00.000Z", end: "2026-07-14T14:30:00.000Z", available: true },
    { start: "2026-07-14T14:30:00.000Z", end: "2026-07-14T15:00:00.000Z", available: true },
    { start: "2026-07-14T15:00:00.000Z", end: "2026-07-14T15:30:00.000Z", available: true },
  ]);
});

Deno.test("parseMrbsPage throws when the day table is missing", () => {
  assertThrows(() => parseMrbsPage("<html><body>not a booking page</body></html>"), Error, "day_main");
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `deno test src/supabase/functions/mrbsClient.test.ts`
Expected: FAIL — `Module not found "./mrbsClient.ts"` (file doesn't exist yet).

- [ ] **Step 3: Implement `mrbsClient.ts`'s parsing layer**

Create `src/supabase/functions/mrbsClient.ts`:

```ts
import type { Slot } from './parseAvailability.ts';

export interface MrbsRoomColumn {
  roomId: string;
  code: string;
}

export interface MrbsPage {
  rooms: MrbsRoomColumn[];
  slotsByRoomId: Map<string, Slot[]>;
}

/**
 * MRBS room labels and this codebase's `building_rooms.room_name` both end in the
 * room's distinguishing code as their last whitespace-separated token — e.g. header
 * label "HA 092" / "CLC 202" vs DB name "ANGU – Room 092" / "DLAM – CLC Room 202".
 * Matching on that trailing token sidesteps the "HA" vs "ANGU" building-code mismatch
 * between MRBS's internal naming and this codebase's, without needing a lookup table.
 */
export function extractRoomCode(name: string): string {
  const token = name.trim().split(/\s+/).pop();
  if (!token) {
    throw new Error(`Could not extract a room code from "${name}"`);
  }
  return token.toUpperCase();
}

/**
 * MRBS's day-view table represents a booking spanning multiple half-hour rows with a
 * single `rowspan`-ed `<td>`, omitting that column's `<td>` entirely from the rows it
 * spans over. Reconstructing per-room slots means walking the table as a grid: tracking,
 * per column, how many upcoming rows are already spoken for by an earlier row's rowspan,
 * and only consuming a new `<td>` from a row when that column isn't currently pending.
 *
 * The table's `<thead data-slots="[[[start,end],...]]">` gives the exact UTC instant
 * boundaries for every row directly (unlike LibCal, no wall-clock/DST math is needed) —
 * the outer array wraps a single day's list of `[start, end]` pairs.
 */
export function parseMrbsPage(html: string): MrbsPage {
  const tableMatch = /<table class="dwm_main" id="day_main"[^>]*>(.*?)<\/table>/s.exec(html);
  if (!tableMatch) {
    throw new Error('Could not find MRBS day table (id="day_main") in page');
  }
  const tableHtml = tableMatch[1];

  const slotsMatch = /data-slots="([^"]*)"/.exec(tableHtml);
  if (!slotsMatch) {
    throw new Error('Could not find data-slots attribute in MRBS page');
  }
  const parsedSlots = JSON.parse(slotsMatch[1]) as [number, number][][];
  const daySlots = parsedSlots[0];
  if (!daySlots || daySlots.length === 0) {
    throw new Error('MRBS data-slots attribute contained no slots for the requested day');
  }

  const headerMatch = /<thead[^>]*>(.*?)<\/thead>/s.exec(tableHtml);
  if (!headerMatch) {
    throw new Error('Could not find MRBS table header in page');
  }
  const headerRegex =
    /<th data-room="(\d+)"><a href="[^"]*"\s+title\s*=\s*"[^"]*">([^<]+)<span class="capacity">/g;
  const rooms: MrbsRoomColumn[] = [];
  for (const match of headerMatch[1].matchAll(headerRegex)) {
    rooms.push({ roomId: match[1], code: extractRoomCode(match[2]) });
  }
  if (rooms.length === 0) {
    throw new Error('Could not find any room columns in MRBS page header');
  }

  const bodyMatch = /<tbody>(.*?)<\/tbody>/s.exec(tableHtml);
  if (!bodyMatch) {
    throw new Error('Could not find MRBS table body in page');
  }
  const rowHtmls = [...bodyMatch[1].matchAll(/<tr[^>]*>(.*?)<\/tr>/gs)].map((m) => m[1]);
  if (rowHtmls.length !== daySlots.length) {
    throw new Error(
      `MRBS row count (${rowHtmls.length}) does not match data-slots count (${daySlots.length})`,
    );
  }

  const slotsByRoomId = new Map<string, Slot[]>(rooms.map((r) => [r.roomId, []]));
  const cellRegex = /<td class="(new|booked)"(?: rowspan="(\d+)")?[^>]*>/g;
  const pendingRows = new Array(rooms.length).fill(0);

  for (let rowIndex = 0; rowIndex < rowHtmls.length; rowIndex++) {
    const expectedCells = pendingRows.filter((n) => n === 0).length;
    const cells = [...rowHtmls[rowIndex].matchAll(cellRegex)];
    if (cells.length !== expectedCells) {
      throw new Error(
        `Unexpected MRBS row shape at row ${rowIndex}: expected ${expectedCells} cells, found ${cells.length}`,
      );
    }

    let cellCursor = 0;
    for (let col = 0; col < rooms.length; col++) {
      if (pendingRows[col] > 0) {
        pendingRows[col]--;
        continue;
      }

      const cell = cells[cellCursor++];
      const cssClass = cell[1];
      const span = cell[2] ? Number(cell[2]) : 1;
      const [start] = daySlots[rowIndex];
      const [, end] = daySlots[rowIndex + span - 1];

      slotsByRoomId.get(rooms[col].roomId)!.push({
        start: new Date(start * 1000).toISOString(),
        end: new Date(end * 1000).toISOString(),
        available: cssClass === 'new',
      });

      if (span > 1) {
        pendingRows[col] = span - 1;
      }
    }
  }

  return { rooms, slotsByRoomId };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `deno test src/supabase/functions/mrbsClient.test.ts`
Expected: `ok | 5 passed | 0 failed`

- [ ] **Step 5: Commit**

```bash
git add src/supabase/functions/mrbsClient.ts src/supabase/functions/mrbsClient.test.ts
git commit -m "feat: add MRBS day-table parsing for Sauder booking availability"
```

---

### Task 2: MRBS network fetch with per-(site, date) caching

**Files:**
- Modify: `src/supabase/functions/mrbsClient.ts`
- Modify: `src/supabase/functions/mrbsClient.test.ts`

**Interfaces:**
- Consumes: `parseMrbsPage`, `extractRoomCode`, `MrbsPage` from Task 1 (same file).
- Produces: `fetchMrbsSlots(baseUrl: string, roomName: string, date: Date): Promise<Slot[]>` — consumed by Task 3's `roomSync.ts`.

- [ ] **Step 1: Write the failing tests**

In `src/supabase/functions/mrbsClient.test.ts`, update the two existing import lines at the top of the file to also pull in `assertRejects` and `fetchMrbsSlots`:

```ts
import { assertEquals, assertThrows, assertRejects } from "jsr:@std/assert";
import { extractRoomCode, parseMrbsPage, fetchMrbsSlots } from "./mrbsClient.ts";
```

Then append this to the end of the file:

```ts
function stubFetch(html: string): { calls: string[]; restore: () => void } {
  const calls: string[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = ((input: string | URL | Request) => {
    calls.push(String(input));
    return Promise.resolve(new Response(html, { status: 200 }));
  }) as typeof fetch;
  return {
    calls,
    restore: () => {
      globalThis.fetch = original;
    },
  };
}

Deno.test("fetchMrbsSlots requests the Vancouver-local day view and resolves by room code", async () => {
  const { calls, restore } = stubFetch(FIXTURE_HTML);
  try {
    const slots = await fetchMrbsSlots(
      "https://example.test/site-a/",
      "ANGU – Room 001",
      new Date("2026-07-14T20:00:00.000Z"),
    );
    assertEquals(calls, ["https://example.test/site-a/index.php?view=day&year=2026&month=07&day=14"]);
    assertEquals(slots[0], {
      start: "2026-07-14T14:00:00.000Z",
      end: "2026-07-14T14:30:00.000Z",
      available: true,
    });
  } finally {
    restore();
  }
});

Deno.test("fetchMrbsSlots caches the fetched page per site and date", async () => {
  const { calls, restore } = stubFetch(FIXTURE_HTML);
  try {
    const date = new Date("2026-07-14T20:00:00.000Z");
    await fetchMrbsSlots("https://example.test/site-b/", "ANGU – Room 001", date);
    await fetchMrbsSlots("https://example.test/site-b/", "ANGU – Room 002", date);
    assertEquals(calls.length, 1);
  } finally {
    restore();
  }
});

Deno.test("fetchMrbsSlots throws when no MRBS room matches the given name", async () => {
  const { restore } = stubFetch(FIXTURE_HTML);
  try {
    await assertRejects(
      () =>
        fetchMrbsSlots("https://example.test/site-c/", "ANGU – Room 999", new Date("2026-07-14T20:00:00.000Z")),
      Error,
      'Could not find MRBS room matching "ANGU – Room 999"',
    );
  } finally {
    restore();
  }
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `deno test src/supabase/functions/mrbsClient.test.ts`
Expected: FAIL — `does not provide an export named 'fetchMrbsSlots'`.

- [ ] **Step 3: Implement the fetch/cache layer**

Add to `src/supabase/functions/mrbsClient.ts` (below the existing code):

```ts
const REQUEST_TIMEOUT_MS = 10_000;
const MRBS_TIME_ZONE = 'America/Vancouver';

const pageCache = new Map<string, MrbsPage>();

/** Mirrors the "en-CA formats as YYYY-MM-DD" trick already used in libcalClient.ts. */
function vancouverDateParts(date: Date, timeZone: string): { year: string; month: string; day: string } {
  const [year, month, day] = new Intl.DateTimeFormat('en-CA', { timeZone }).format(date).split('-');
  return { year, month, day };
}

async function fetchMrbsPage(baseUrl: string, date: Date): Promise<MrbsPage> {
  const { year, month, day } = vancouverDateParts(date, MRBS_TIME_ZONE);
  const cacheKey = `${baseUrl}:${year}-${month}-${day}`;
  const cached = pageCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const url = `${baseUrl}index.php?view=day&year=${year}&month=${month}&day=${day}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!response.ok) {
    throw new Error(`MRBS request failed for ${url}: ${response.status}`);
  }

  const page = parseMrbsPage(await response.text());
  pageCache.set(cacheKey, page);
  return page;
}

export async function fetchMrbsSlots(baseUrl: string, roomName: string, date: Date): Promise<Slot[]> {
  const page = await fetchMrbsPage(baseUrl, date);
  const code = extractRoomCode(roomName);
  const room = page.rooms.find((r) => r.code === code);
  if (!room) {
    throw new Error(`Could not find MRBS room matching "${roomName}" (code "${code}") at ${baseUrl}`);
  }
  return page.slotsByRoomId.get(room.roomId) ?? [];
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `deno test src/supabase/functions/mrbsClient.test.ts`
Expected: `ok | 8 passed | 0 failed`

- [ ] **Step 5: Commit**

```bash
git add src/supabase/functions/mrbsClient.ts src/supabase/functions/mrbsClient.test.ts
git commit -m "feat: fetch and cache MRBS day pages by site and date"
```

---

### Task 3: Dispatch MRBS rooms from the sync entrypoint

**Files:**
- Create: `src/supabase/functions/roomSync.ts`
- Create: `src/supabase/functions/roomSync.test.ts`
- Modify: `src/supabase/functions/index.ts`

**Interfaces:**
- Consumes: `fetchMrbsSlots` (Task 2), `fetchLibcalSlots` (existing, unchanged `src/supabase/functions/libcalClient.ts`), `parseAvailability` (existing, unchanged `src/supabase/functions/parseAvailability.ts`).
- Produces: `classifyRooms(rows: BuildingRoomRow[]): SourcedRoom[]`, `processInBatches(rooms: SourcedRoom[], supabase: SupabaseClient): Promise<void>`, and the `BuildingRoomRow`/`SourcedRoom` types — consumed by `index.ts`.

- [ ] **Step 1: Write the failing test**

Create `src/supabase/functions/roomSync.test.ts`:

```ts
import { assertEquals } from "jsr:@std/assert";
import { classifyRooms } from "./roomSync.ts";

Deno.test("classifyRooms routes LibCal links by extracting their space id", () => {
  const result = classifyRooms([
    { uuid: "a", link: "https://libcal.library.ubc.ca/space/12057", room_name: "IKBLC - Room 1" },
    { uuid: "b", link: "https://amsubc.libcal.com/space/999", room_name: "Nest - Room 2" },
  ]);
  assertEquals(result, [
    { kind: "libcal", uuid: "a", host: "libcal.library.ubc.ca", spaceId: "12057" },
    { kind: "libcal", uuid: "b", host: "amsubc.libcal.com", spaceId: "999" },
  ]);
});

Deno.test("classifyRooms routes MRBS links by base URL, carrying room_name through for later matching", () => {
  const result = classifyRooms([
    { uuid: "c", link: "https://booking.sauder.ubc.ca/ugr/", room_name: "ANGU – Room 092" },
    { uuid: "d", link: "https://booking.sauder.ubc.ca/clc/", room_name: "DLAM – CLC Room 202" },
  ]);
  assertEquals(result, [
    { kind: "mrbs", uuid: "c", baseUrl: "https://booking.sauder.ubc.ca/ugr/", roomName: "ANGU – Room 092" },
    { kind: "mrbs", uuid: "d", baseUrl: "https://booking.sauder.ubc.ca/clc/", roomName: "DLAM – CLC Room 202" },
  ]);
});

Deno.test("classifyRooms skips rooms with no link, an unrecognized link, or a missing room_name for MRBS", () => {
  const result = classifyRooms([
    { uuid: "e", link: null, room_name: "Some Room" },
    { uuid: "f", link: "https://example.com/unrelated", room_name: "Some Room" },
    { uuid: "g", link: "https://booking.sauder.ubc.ca/ugr/", room_name: null },
  ]);
  assertEquals(result, []);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `deno test src/supabase/functions/roomSync.test.ts`
Expected: FAIL — `Module not found "./roomSync.ts"` (file doesn't exist yet).

- [ ] **Step 3: Create `roomSync.ts`, extracting and generalizing the existing `index.ts` logic**

Create `src/supabase/functions/roomSync.ts`:

```ts
import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';
import { parseAvailability } from './parseAvailability.ts';
import { fetchLibcalSlots } from './libcalClient.ts';
import { fetchMrbsSlots } from './mrbsClient.ts';

const LIBCAL_HOSTS = ['libcal.library.ubc.ca', 'amsubc.libcal.com'];
const MRBS_BASE_URLS = ['https://booking.sauder.ubc.ca/ugr/', 'https://booking.sauder.ubc.ca/clc/'];
const CONCURRENCY = 4;
const BATCH_DELAY_MS = 500;

export interface BuildingRoomRow {
  uuid: string;
  link: string | null;
  room_name: string | null;
}

export type SourcedRoom =
  | { kind: 'libcal'; uuid: string; host: string; spaceId: string }
  | { kind: 'mrbs'; uuid: string; baseUrl: string; roomName: string };

export function classifyRooms(rows: BuildingRoomRow[]): SourcedRoom[] {
  const rooms: SourcedRoom[] = [];

  for (const row of rows) {
    if (!row.link) continue;

    let matched = false;
    for (const host of LIBCAL_HOSTS) {
      const match = row.link.match(new RegExp(`^https://${host}/space/(\\d+)`));
      if (match) {
        rooms.push({ kind: 'libcal', uuid: row.uuid, host, spaceId: match[1] });
        matched = true;
        break;
      }
    }
    if (matched) continue;

    const baseUrl = MRBS_BASE_URLS.find((url) => row.link!.startsWith(url));
    if (baseUrl && row.room_name) {
      rooms.push({ kind: 'mrbs', uuid: row.uuid, baseUrl, roomName: row.room_name });
    }
  }

  return rooms;
}

async function processRoom(supabase: SupabaseClient, room: SourcedRoom): Promise<void> {
  try {
    const slots =
      room.kind === 'libcal'
        ? await fetchLibcalSlots(room.host, room.spaceId, new Date())
        : await fetchMrbsSlots(room.baseUrl, room.roomName, new Date());
    const result = parseAvailability(slots, new Date());
    const { error } = await supabase.from('room_availability').upsert({
      room_uuid: room.uuid,
      is_available_now: result.isAvailableNow,
      available_until: result.availableUntil,
      next_available_at: result.nextAvailableAt,
      slots,
      checked_at: new Date().toISOString(),
    });
    if (error) {
      console.error(`upsert failed for room ${room.uuid}:`, error.message);
    }
  } catch (err) {
    console.error(`fetch/parse failed for room ${room.uuid}:`, err);
  }
}

export async function processInBatches(rooms: SourcedRoom[], supabase: SupabaseClient): Promise<void> {
  for (let i = 0; i < rooms.length; i += CONCURRENCY) {
    const batch = rooms.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map((room) => processRoom(supabase, room)));
    if (i + CONCURRENCY < rooms.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `deno test src/supabase/functions/roomSync.test.ts`
Expected: `ok | 3 passed | 0 failed`

- [ ] **Step 5: Update `index.ts` to delegate to `roomSync.ts`**

Replace the full contents of `src/supabase/functions/index.ts`:

```ts
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { classifyRooms, processInBatches } from './roomSync.ts';

Deno.serve(async () => {
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const { data, error } = await supabase
    .from('building_rooms')
    .select('uuid, link, room_name')
    .not('link', 'is', null);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rooms = classifyRooms(data ?? []);
  await processInBatches(rooms, supabase);

  return new Response(JSON.stringify({ processed: rooms.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

- [ ] **Step 6: Verify the whole edge function still type-checks**

Run: `deno check src/supabase/functions/index.ts`
Expected: no type errors (may take a moment on first run while Deno fetches `jsr:` dependencies).

- [ ] **Step 7: Live smoke-check against the real Sauder site**

This isn't an automated test — MRBS's actual HTML is the one thing that can't be verified from a synthetic fixture alone. Create a throwaway script at `/tmp/mrbs-smoke-check.ts`:

```ts
import { fetchMrbsSlots } from "file:///Users/funghokyeung/WebstormProjects/UBSeats/src/supabase/functions/mrbsClient.ts";

const slots = await fetchMrbsSlots("https://booking.sauder.ubc.ca/ugr/", "ANGU – Room 092", new Date());
console.log(JSON.stringify(slots, null, 2));
```

Run: `deno run --allow-net=booking.sauder.ubc.ca /tmp/mrbs-smoke-check.ts`

Expected: a JSON array of `{start, end, available}` slots covering roughly 07:00–22:30 Vancouver time today. Open `https://booking.sauder.ubc.ca/ugr/` in a browser side by side and confirm the booked/free blocks for "HA 092" line up with the printed slots. Repeat once for a `/clc/` room (e.g. `"DLAM – CLC Room 202"`) to confirm both sites resolve correctly. Delete `/tmp/mrbs-smoke-check.ts` afterward — it's throwaway, not committed.

- [ ] **Step 8: Commit**

```bash
git add src/supabase/functions/roomSync.ts src/supabase/functions/roomSync.test.ts src/supabase/functions/index.ts
git commit -m "feat: dispatch MRBS rooms alongside LibCal in the availability sync"
```

---

## Self-Review Notes

- **Spec coverage:** name-matching room resolution (Task 1/2), both `/ugr/` and `/clc/` sites (Task 3's `MRBS_BASE_URLS`), shared `parseAvailability`/upsert path (Task 3's `processRoom`), no DB writes (confirmed — nothing in any task touches `building_rooms`), local-only with deploy deferred (Global Constraints + Task 3 Step 7 uses a local smoke check, not a deploy).
- **Type consistency:** `SourcedRoom`'s `{kind: 'mrbs', baseUrl, roomName}` shape (Task 3) matches exactly what `fetchMrbsSlots(baseUrl, roomName, date)` (Task 2) expects, and `BuildingRoomRow`'s `room_name: string | null` matches the nullable column already returned by Supabase's generated types for `building_rooms`.
- **No placeholders:** every step has complete, runnable code; no "add error handling" or "similar to Task N" shortcuts.
