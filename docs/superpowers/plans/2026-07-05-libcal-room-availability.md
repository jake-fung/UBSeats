# LibCal Room Availability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a live "Available now" / "Busy until X" badge on `RoomCard` for the ~51 rooms whose booking link points at UBC's LibCal system, backed by a scheduled scraper instead of a client-side call to LibCal.

**Architecture:** `pg_cron` invokes a Supabase Edge Function every 15 minutes. The function reads LibCal-linked rooms from `building_rooms`, fetches each room's slot data from LibCal, computes availability, and upserts into a new `room_availability` table. The frontend polls that table on its own TanStack Query key and merges it into `RoomCard` at render time — the existing `fetchBuildings()` call and `Building`/`Room` types are untouched.

**Tech Stack:** Supabase Postgres + pg_cron + pg_net + Vault, Deno Edge Functions, React + TanStack Query (existing).

**Full design spec:** `docs/superpowers/specs/2026-07-05-libcal-room-availability-design.md`

## Global Constraints

- Scope is LibCal rooms only (`libcal.library.ubc.ca`, `amsubc.libcal.com`) — do not touch Sauder/MRBS or `learningspaces.ubc.ca` rooms.
- Poll cadence: every 15 minutes server-side; client polls the resulting table every 90 seconds.
- Staleness cutoff: 30 minutes. Rows older than that are treated as absent (no badge), never shown as-is.
- A failure on one room must not abort processing of the other rooms in that run.
- RLS policy convention on every existing table is `create policy "Enable read access for all users" on <table> for select to public using (true)` — match it exactly, no other policies.
- No new frontend test framework (matches this project's existing, deliberate decision to defer that). The Deno-based test in Task 2 is scoped entirely to the new Edge Function code and requires no npm changes.
- Concurrency cap of 4 in-flight LibCal requests with a 500ms delay between batches — do not parallelize all rooms at once.
- Project URL: `https://rhtqhrlaaibyxkatzbkn.supabase.co`. Wherever a step below needs `<SUPABASE_ANON_KEY>`, fetch it fresh via the `mcp__supabase__get_publishable_keys` tool and use the **legacy, JWT-format key** (the one starting `eyJhbGci...`, listed with `"type": "legacy"`), never the newer `sb_publishable_...` key — Edge Functions' `verify_jwt` check requires an actual JWT, and the newer key format isn't one. Never commit the literal key value into a file.

---

## File Structure

New files:
- `supabase/functions/sync-libcal-availability/index.ts` — Edge Function entrypoint (reads rooms, orchestrates fetch+parse+upsert)
- `supabase/functions/sync-libcal-availability/parseAvailability.ts` — pure slot→status calculator
- `supabase/functions/sync-libcal-availability/parseAvailability.test.ts` — Deno test for the above
- `supabase/functions/sync-libcal-availability/libcalClient.ts` — adapter that calls LibCal and returns normalized slots
- `src/hooks/useRoomAvailability.ts` — TanStack Query hook, polls `room_availability`
- `src/components/details/AvailabilityBadge.tsx` — the badge UI

Modified files:
- `src/supabase/schema/types.ts` — add `RoomAvailability` type
- `src/supabase/schema/database.types.ts` — regenerated (adds `room_availability` table types)
- `src/supabase/services/supabaseService.ts` — add `fetchRoomAvailability()`
- `src/components/details/RoomCard.tsx` — render `AvailabilityBadge`

No changes to `Building`, `Room` (existing fields), `fetchBuildings()`, `useBuildings`, `RoomSection`, `LibraryCard`, or `BuildingDetailContent` — availability is looked up independently inside `RoomCard`, not threaded through the building tree.

---

### Task 1: `room_availability` table, RLS, and regenerated types

**Files:**
- Migration (applied via MCP, no local file — matches this project's existing migration convention of applying directly rather than tracking a local `supabase/migrations` folder)
- Modify: `src/supabase/schema/database.types.ts` (full regeneration)

**Interfaces:**
- Produces: table `room_availability(room_uuid uuid primary key, is_available_now boolean, available_until timestamptz, next_available_at timestamptz, checked_at timestamptz)`, and its generated `Database['public']['Tables']['room_availability']` type, consumed by Task 6.

- [ ] **Step 1: Apply the migration**

Use the `mcp__supabase__apply_migration` tool:
- `name`: `create_room_availability`
- `query`:
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

- [ ] **Step 2: Verify the table and policy**

Use the `mcp__supabase__execute_sql` tool:
```sql
select tablename, policyname, cmd, qual from pg_policies where tablename = 'room_availability';
```
Expected: one row — `room_availability | Enable read access for all users | SELECT | true`.

- [ ] **Step 3: Regenerate TypeScript types**

Use the `mcp__supabase__generate_typescript_types` tool and overwrite `src/supabase/schema/database.types.ts` with the full returned content.

- [ ] **Step 4: Verify the type was generated**

Run: `grep -c "room_availability" src/supabase/schema/database.types.ts`
Expected: a non-zero count (the table appears in the `Tables` map).

- [ ] **Step 5: Commit**

```bash
git add src/supabase/schema/database.types.ts
git commit -m "feat: add room_availability table and regenerate Supabase types"
```

---

### Task 2: Pure availability calculator (`parseAvailability`)

**Files:**
- Create: `supabase/functions/sync-libcal-availability/parseAvailability.ts`
- Create: `supabase/functions/sync-libcal-availability/parseAvailability.test.ts`

**Interfaces:**
- Consumes: nothing (pure function, no external types).
- Produces: `Slot` and `AvailabilityResult` types, and `parseAvailability(slots: Slot[], now: Date): AvailabilityResult` — consumed by Task 4's `index.ts`.

- [ ] **Step 1: Install Deno (if not already present)**

Run: `which deno || brew install deno`
Expected: a `deno` path printed, or a successful install followed by `deno --version` showing `deno 2.x`.

- [ ] **Step 2: Write the failing test**

Create `supabase/functions/sync-libcal-availability/parseAvailability.test.ts`:
```ts
import { assertEquals } from "jsr:@std/assert";
import { parseAvailability, type Slot } from "./parseAvailability.ts";

const NOW = new Date("2026-07-05T20:00:00.000Z");

Deno.test("no slots at all -> available now, no bounds", () => {
  const result = parseAvailability([], NOW);
  assertEquals(result, { isAvailableNow: true, availableUntil: null, nextAvailableAt: null });
});

Deno.test("booked slot covering now -> not available, reports when it ends", () => {
  const slots: Slot[] = [
    { start: "2026-07-05T19:30:00.000Z", end: "2026-07-05T20:30:00.000Z", available: false },
  ];
  const result = parseAvailability(slots, NOW);
  assertEquals(result, {
    isAvailableNow: false,
    availableUntil: null,
    nextAvailableAt: "2026-07-05T20:30:00.000Z",
  });
});

Deno.test("booked slot in the future only -> available now, reports when booking starts", () => {
  const slots: Slot[] = [
    { start: "2026-07-05T21:00:00.000Z", end: "2026-07-05T22:00:00.000Z", available: false },
  ];
  const result = parseAvailability(slots, NOW);
  assertEquals(result, {
    isAvailableNow: true,
    availableUntil: "2026-07-05T21:00:00.000Z",
    nextAvailableAt: null,
  });
});

Deno.test("two consecutive booked slots covering now -> merges into one end time", () => {
  const slots: Slot[] = [
    { start: "2026-07-05T19:30:00.000Z", end: "2026-07-05T20:30:00.000Z", available: false },
    { start: "2026-07-05T20:30:00.000Z", end: "2026-07-05T21:00:00.000Z", available: false },
  ];
  const result = parseAvailability(slots, NOW);
  assertEquals(result, {
    isAvailableNow: false,
    availableUntil: null,
    nextAvailableAt: "2026-07-05T21:00:00.000Z",
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `deno test supabase/functions/sync-libcal-availability/parseAvailability.test.ts`
Expected: FAIL — `Module not found "./parseAvailability.ts"` (file doesn't exist yet).

- [ ] **Step 4: Implement `parseAvailability`**

Create `supabase/functions/sync-libcal-availability/parseAvailability.ts`:
```ts
export interface Slot {
  start: string; // ISO 8601
  end: string; // ISO 8601
  available: boolean;
}

export interface AvailabilityResult {
  isAvailableNow: boolean;
  availableUntil: string | null;
  nextAvailableAt: string | null;
}

export function parseAvailability(slots: Slot[], now: Date): AvailabilityResult {
  const sorted = [...slots].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  const nowMs = now.getTime();

  const current = sorted.find(
    (s) => new Date(s.start).getTime() <= nowMs && nowMs < new Date(s.end).getTime(),
  );

  if (!current || current.available) {
    const nextBooked = sorted.find((s) => !s.available && new Date(s.start).getTime() >= nowMs);
    return {
      isAvailableNow: true,
      availableUntil: nextBooked ? nextBooked.start : null,
      nextAvailableAt: null,
    };
  }

  // Booked right now. LibCal reports back-to-back bookings as separate slots, so walk
  // forward while each next slot starts exactly where the previous one ended.
  let endOfBooking = current.end;
  for (const slot of sorted) {
    if (!slot.available && new Date(slot.start).getTime() === new Date(endOfBooking).getTime()) {
      endOfBooking = slot.end;
    }
  }

  return {
    isAvailableNow: false,
    availableUntil: null,
    nextAvailableAt: endOfBooking,
  };
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `deno test supabase/functions/sync-libcal-availability/parseAvailability.test.ts`
Expected: `ok | 4 passed | 0 failed`

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/sync-libcal-availability/parseAvailability.ts supabase/functions/sync-libcal-availability/parseAvailability.test.ts
git commit -m "feat: add pure availability calculator for LibCal room sync"
```

---

### Task 3: Discover LibCal's request and implement `libcalClient`

This is the one genuinely external unknown in this plan: LibCal's availability grid is populated by a JS-driven request that isn't visible from static HTML/JS inspection (confirmed during design — see the spec's Background section). It requires a one-time manual capture in a real browser. This step cannot be done by grep/curl; it needs DevTools.

**Files:**
- Create: `supabase/functions/sync-libcal-availability/libcalClient.ts`

**Interfaces:**
- Consumes: `Slot` type from Task 2 (`./parseAvailability.ts`).
- Produces: `fetchLibcalSlots(host: string, spaceId: string, date: Date): Promise<Slot[]>` — consumed by Task 4's `index.ts`.

- [ ] **Step 1: Capture the real request (manual, ~10 minutes)**

1. Open `https://libcal.library.ubc.ca/space/12057` in Chrome or Firefox.
2. Open DevTools → Network tab → filter to **Fetch/XHR**.
3. Click the calendar's next-date arrow (or any control that changes the visible date range) to force a fresh data load.
4. In the list of requests, find the one whose **response** body contains per-slot booking data — from the shipped JS (`createStartTimeToClassMap`), each entry has at least a `start` timestamp and a `className` (or similarly named field) indicating booked vs. free.
5. Right-click that request → **Copy** → **Copy as cURL**.
6. Note down: the exact URL, HTTP method, request headers, and request body/query params.

- [ ] **Step 2: Implement the adapter using the captured request**

Create `supabase/functions/sync-libcal-availability/libcalClient.ts`, replacing the `fetch(...)` call's URL/method/headers/body below with what was captured in Step 1, and replacing the body of `toSlots` with the actual field names from the captured response shape:

```ts
import type { Slot } from "./parseAvailability.ts";

interface RawLibcalEntry {
  start: string;
  end?: string;
  className?: string;
  [key: string]: unknown;
}

/**
 * Maps LibCal's raw per-slot entries into this codebase's normalized Slot shape.
 * `className` (or whatever field the capture in Step 1 revealed) is LibCal's own
 * indicator of booked vs. free — update the `available` check below to match it.
 */
function toSlots(entries: RawLibcalEntry[]): Slot[] {
  return entries
    .filter((entry): entry is RawLibcalEntry & { end: string } => typeof entry.end === "string")
    .map((entry) => ({
      start: entry.start,
      end: entry.end,
      available: !(entry.className ?? "").includes("booked"),
    }));
}

export async function fetchLibcalSlots(host: string, spaceId: string, date: Date): Promise<Slot[]> {
  const dateParam = date.toISOString().slice(0, 10); // YYYY-MM-DD

  const response = await fetch(`https://${host}/ajax/space/times`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ spaceId, date: dateParam }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    throw new Error(`LibCal request failed for space ${spaceId} on ${host}: ${response.status}`);
  }

  const data = await response.json();
  return toSlots(Array.isArray(data) ? data : (data.slots ?? data.gridData ?? []));
}
```

- [ ] **Step 3: Verify manually against a known room**

Create a throwaway script `supabase/functions/sync-libcal-availability/_manual_check.ts`:
```ts
import { fetchLibcalSlots } from "./libcalClient.ts";

const slots = await fetchLibcalSlots("libcal.library.ubc.ca", "12057", new Date());
console.log(JSON.stringify(slots, null, 2));
```

Run: `deno run --allow-net supabase/functions/sync-libcal-availability/_manual_check.ts`

Expected: an array of `{ start, end, available }` objects that, eyeballed against the room's actual booking calendar in a browser, matches reality (a slot you can see is booked in the browser shows `available: false` here, and vice versa). If the shape doesn't match, adjust `toSlots` and the request in Step 2 and re-run — this is the step where the adapter gets tuned to what LibCal actually returns.

Delete the throwaway script once satisfied: `rm supabase/functions/sync-libcal-availability/_manual_check.ts` (it must not be deployed — Task 4's deploy step only uploads `index.ts`, `parseAvailability.ts`, and `libcalClient.ts`).

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/sync-libcal-availability/libcalClient.ts
git commit -m "feat: add LibCal availability adapter"
```

---

### Task 4: Edge Function entrypoint and deployment

**Files:**
- Create: `supabase/functions/sync-libcal-availability/index.ts`

**Interfaces:**
- Consumes: `parseAvailability` (Task 2), `fetchLibcalSlots` (Task 3), table `room_availability` (Task 1).
- Produces: deployed function reachable at `https://rhtqhrlaaibyxkatzbkn.supabase.co/functions/v1/sync-libcal-availability` — consumed by Task 5's cron schedule.

- [ ] **Step 1: Write the entrypoint**

Create `supabase/functions/sync-libcal-availability/index.ts`:
```ts
import { createClient, type SupabaseClient } from "jsr:@supabase/supabase-js@2";
import { parseAvailability } from "./parseAvailability.ts";
import { fetchLibcalSlots } from "./libcalClient.ts";

const LIBCAL_HOSTS = ["libcal.library.ubc.ca", "amsubc.libcal.com"];
const CONCURRENCY = 4;
const BATCH_DELAY_MS = 500;

interface LibcalRoom {
  uuid: string;
  host: string;
  spaceId: string;
}

function parseLibcalRooms(rows: { uuid: string; link: string | null }[]): LibcalRoom[] {
  const rooms: LibcalRoom[] = [];
  for (const row of rows) {
    if (!row.link) continue;
    for (const host of LIBCAL_HOSTS) {
      const match = row.link.match(new RegExp(`^https://${host}/space/(\\d+)`));
      if (match) {
        rooms.push({ uuid: row.uuid, host, spaceId: match[1] });
        break;
      }
    }
  }
  return rooms;
}

async function processRoom(supabase: SupabaseClient, room: LibcalRoom): Promise<void> {
  try {
    const slots = await fetchLibcalSlots(room.host, room.spaceId, new Date());
    const result = parseAvailability(slots, new Date());
    const { error } = await supabase.from("room_availability").upsert({
      room_uuid: room.uuid,
      is_available_now: result.isAvailableNow,
      available_until: result.availableUntil,
      next_available_at: result.nextAvailableAt,
      checked_at: new Date().toISOString(),
    });
    if (error) {
      console.error(`upsert failed for room ${room.uuid}:`, error.message);
    }
  } catch (err) {
    console.error(`fetch/parse failed for room ${room.uuid} (space ${room.spaceId}):`, err);
  }
}

async function processInBatches(rooms: LibcalRoom[], supabase: SupabaseClient): Promise<void> {
  for (let i = 0; i < rooms.length; i += CONCURRENCY) {
    const batch = rooms.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map((room) => processRoom(supabase, room)));
    if (i + CONCURRENCY < rooms.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await supabase.from("building_rooms").select("uuid, link").not("link", "is", null);
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rooms = parseLibcalRooms(data ?? []);
  await processInBatches(rooms, supabase);

  return new Response(JSON.stringify({ processed: rooms.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

- [ ] **Step 2: Deploy the function**

Use the `mcp__supabase__deploy_edge_function` tool:
- `name`: `sync-libcal-availability`
- `entrypoint_path`: `index.ts`
- `verify_jwt`: `true`
- `files`: the contents of `supabase/functions/sync-libcal-availability/index.ts`, `parseAvailability.ts`, and `libcalClient.ts` (read each file and pass its content).

- [ ] **Step 3: Invoke it manually and verify**

Run directly over HTTPS (no Postgres involved — this just confirms the deployed function itself works, independent of the cron wiring built in Task 5):
```bash
curl -i -X POST 'https://rhtqhrlaaibyxkatzbkn.supabase.co/functions/v1/sync-libcal-availability' \
  -H 'Authorization: Bearer <SUPABASE_ANON_KEY>' \
  -H 'Content-Type: application/json'
```
Expected: HTTP `200` with a JSON body like `{"processed": 51}` (or close to it — the count of LibCal rooms).

Then verify actual rows landed, using `mcp__supabase__execute_sql`:
```sql
select count(*) from room_availability;
```
Expected: a count close to 51, not 0.

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/sync-libcal-availability/index.ts
git commit -m "feat: add sync-libcal-availability Edge Function entrypoint"
```

---

### Task 5: Schedule the sync via pg_cron

**Files:** none (pure Supabase configuration, applied via MCP)

**Interfaces:**
- Consumes: the deployed function URL from Task 4.
- Produces: a recurring `cron.job` named `sync-libcal-availability` that keeps `room_availability` fresh — consumed implicitly by Task 6/7 (the frontend just reads whatever's in the table).

- [ ] **Step 1: Enable `pg_cron` and `pg_net`**

Use the `mcp__supabase__apply_migration` tool:
- `name`: `enable_pg_cron_and_pg_net`
- `query`:
```sql
create extension if not exists pg_cron with schema pg_catalog;
grant usage on schema cron to postgres;
grant all privileges on all tables in schema cron to postgres;

create extension if not exists pg_net;
```

- [ ] **Step 2: Store the invocation secrets in Vault**

Use the `mcp__supabase__apply_migration` tool:
- `name`: `store_libcal_sync_secrets`
- `query`:
```sql
select vault.create_secret('https://rhtqhrlaaibyxkatzbkn.supabase.co', 'project_url');
select vault.create_secret(
  '<SUPABASE_ANON_KEY>',
  'anon_key'
);
```

- [ ] **Step 3: Schedule the job**

Use the `mcp__supabase__apply_migration` tool:
- `name`: `schedule_libcal_availability_sync`
- `query`:
```sql
select cron.schedule(
  'sync-libcal-availability',
  '*/15 * * * *',
  $$
  select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/sync-libcal-availability',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key')
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 20000
  ) as request_id;
  $$
);
```

- [ ] **Step 4: Verify the job is scheduled and ran**

Use `mcp__supabase__execute_sql`:
```sql
select jobname, schedule, active from cron.job where jobname = 'sync-libcal-availability';
```
Expected: one row, `active = true`, `schedule = */15 * * * *`.

Wait for the next 15-minute mark to pass (or trigger once more manually as in Task 4 Step 3), then:
```sql
select status, start_time, end_time from cron.job_run_details
where jobid = (select jobid from cron.job where jobname = 'sync-libcal-availability')
order by start_time desc limit 1;
```
Expected: `status = 'succeeded'`.

- [ ] **Step 5: Commit**

No files changed in this task (pure Supabase-side configuration) — nothing to commit. Note this in the PR/task tracker instead of a git commit.

---

### Task 6: Frontend data layer — types, service call, hook

**Files:**
- Modify: `src/supabase/schema/types.ts`
- Modify: `src/supabase/services/supabaseService.ts`
- Create: `src/hooks/useRoomAvailability.ts`

**Interfaces:**
- Consumes: `Database['public']['Tables']['room_availability']['Row']` (Task 1).
- Produces: `RoomAvailability` type and `useRoomAvailability(roomUuid: string): RoomAvailability | null` — consumed by Task 7's `RoomCard.tsx`.

- [ ] **Step 1: Add the `RoomAvailability` type**

In `src/supabase/schema/types.ts`, add after the `Room` interface (after line 32):
```ts
export interface RoomAvailability {
  isAvailableNow: boolean;
  availableUntil: string | null;
  nextAvailableAt: string | null;
  checkedAt: string;
}
```

- [ ] **Step 2: Add `fetchRoomAvailability` to the service**

In `src/supabase/services/supabaseService.ts`, add near the bottom of the file (after `fetchBuildings`):
```ts
const STALE_AFTER_MS = 30 * 60 * 1000;

export async function fetchRoomAvailability(): Promise<Map<string, RoomAvailability>> {
  const rows = await selectAll('room_availability');
  const now = Date.now();
  const map = new Map<string, RoomAvailability>();
  rows.forEach((row) => {
    if (now - new Date(row.checked_at).getTime() > STALE_AFTER_MS) return;
    map.set(row.room_uuid, {
      isAvailableNow: row.is_available_now,
      availableUntil: row.available_until,
      nextAvailableAt: row.next_available_at,
      checkedAt: row.checked_at,
    });
  });
  return map;
}
```
Add `RoomAvailability` to the existing import from `@/supabase/schema/types` at the top of the file.

- [ ] **Step 3: Add the hook**

Create `src/hooks/useRoomAvailability.ts`:
```ts
import { useQuery } from '@tanstack/react-query';
import { fetchRoomAvailability } from '@/supabase/services/supabaseService';
import { RoomAvailability } from '@/supabase/schema/types';

export const useRoomAvailability = (roomUuid: string): RoomAvailability | null => {
  const { data } = useQuery({
    queryKey: ['room-availability'],
    queryFn: fetchRoomAvailability,
    refetchInterval: 90_000,
  });
  return data?.get(roomUuid) ?? null;
};
```

- [ ] **Step 4: Verify it compiles and fetches**

Run: `npm run build`
Expected: build succeeds with no TypeScript errors.

Run: `npm run dev`, open the app in a browser, open DevTools → Network, and confirm a request to the Supabase REST endpoint for `room_availability` fires on load (filter Network tab for `room_availability`).
Expected: a `200` response with a JSON array (empty is fine at this point since nothing in the UI reads it yet — Task 7 wires that up).

- [ ] **Step 5: Commit**

```bash
git add src/supabase/schema/types.ts src/supabase/services/supabaseService.ts src/hooks/useRoomAvailability.ts
git commit -m "feat: add room availability fetching and polling hook"
```

---

### Task 7: `AvailabilityBadge` component and `RoomCard` wiring

**Files:**
- Create: `src/components/details/AvailabilityBadge.tsx`
- Modify: `src/components/details/RoomCard.tsx`

**Interfaces:**
- Consumes: `RoomAvailability` (Task 6), `useRoomAvailability` (Task 6).
- Produces: visible UI — no further consumers.

- [ ] **Step 1: Create the badge component**

Create `src/components/details/AvailabilityBadge.tsx`:
```tsx
import { RoomAvailability } from '@/supabase/schema/types';

export interface AvailabilityBadgeProps {
  availability: RoomAvailability | null;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export const AvailabilityBadge = ({ availability }: AvailabilityBadgeProps) => {
  if (!availability) return null;

  const label = availability.isAvailableNow
    ? availability.availableUntil
      ? `Available until ${formatTime(availability.availableUntil)}`
      : 'Available now'
    : availability.nextAvailableAt
      ? `Busy until ${formatTime(availability.nextAvailableAt)}`
      : 'Busy';

  return (
    <span
      className={
        availability.isAvailableNow
          ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800'
          : 'rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800'
      }
    >
      {label}
    </span>
  );
};
```

- [ ] **Step 2: Wire it into `RoomCard`**

In `src/components/details/RoomCard.tsx`, apply this full replacement:
```tsx
import { Room } from '@/supabase/schema/types';
import { NoteTags } from '@/components/details/NoteTags';
import { CapacityRow } from '@/components/details/CapacityRow';
import { ViewSpaceButton } from '@/components/details/ViewSpaceButton';
import { AvailabilityBadge } from '@/components/details/AvailabilityBadge';
import { useRoomAvailability } from '@/hooks/useRoomAvailability';

export interface RoomCardProps {
  room: Room;
}

export const RoomCard = ({ room }: RoomCardProps) => {
  const availability = useRoomAvailability(room.uuid);

  return (
    <div className="flex flex-col rounded-xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="mb-3 sm:mb-0">
        <div className="flex flex-wrap items-center gap-x-3">
          <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
          <NoteTags notes={room.notes} />
          <AvailabilityBadge availability={availability} />
        </div>
        <CapacityRow capacity={room.capacity} />
      </div>
      <ViewSpaceButton link={room.link} />
    </div>
  );
};
```

- [ ] **Step 3: Verify in the browser**

Run: `npm run dev`, open the app, select a building known to have a LibCal room (e.g. ALRD — Allard School of Law, or WDWD — Woodward Library, per the rooms listed in `.claude/agent-memory/supabase-room-row-generator/ref_libcal_url_pattern.md`), and open its detail panel.
Expected: rooms with fresh `room_availability` rows (from Task 4/5's runs) show a green "Available until…" or amber "Busy until…" pill next to the room name; rooms with no LibCal link show no pill, same as before this change.

- [ ] **Step 4: Run lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/details/AvailabilityBadge.tsx src/components/details/RoomCard.tsx
git commit -m "feat: show live availability badge on LibCal-backed RoomCards"
```

---

### Task 8: End-to-end verification

**Files:** none — this task only exercises what Tasks 1-7 built.

- [ ] **Step 1: Confirm the full pipeline on a live room**

Pick one specific LibCal room (e.g. space ID `12057`, "ALRD – Room 313"). In a browser, open its real LibCal booking page and note its actual current status (booked or free, and until when).

- [ ] **Step 2: Compare against the app**

In the UBSeats app, open Allard School of Law's detail panel and find "ALRD – Room 313". Confirm the badge's status and time match what you saw on the real LibCal page in Step 1 (within the 15-minute poll window).

- [ ] **Step 3: Confirm staleness handling**

Use `mcp__supabase__execute_sql`:
```sql
update room_availability set checked_at = now() - interval '31 minutes' where room_uuid = (
  select uuid from building_rooms where link = 'https://libcal.library.ubc.ca/space/12057'
);
```
Reload the app's detail panel for that room.
Expected: the badge disappears for that room (client-side staleness filter in `fetchRoomAvailability` correctly excludes it), and no other room is affected.

- [ ] **Step 4: Restore real data**

Re-run the manual invocation from Task 4 Step 3 (or wait for the next cron tick) to refresh the row you just stomped on in Step 3.

- [ ] **Step 5: Confirm cron keeps running unattended**

Wait at least 30 minutes, then use `mcp__supabase__execute_sql`:
```sql
select count(*) from cron.job_run_details
where jobid = (select jobid from cron.job where jobname = 'sync-libcal-availability')
and start_time > now() - interval '30 minutes'
and status = 'succeeded';
```
Expected: at least 1 (ideally 2, given the 15-minute cadence).
