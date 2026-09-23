import type { Slot } from './parseAvailability.ts';

// The two-week grid for a whole LibCal group runs to ~6k slots (AMS), well past the
// one-day response the old 10 s budget was sized for.
const REQUEST_TIMEOUT_MS = 20_000;

// Both LibCal hosts this adapter targets (libcal.library.ubc.ca and amsubc.libcal.com)
// serve UBC Vancouver campus buildings, which are all in this IANA zone.
const LIBCAL_TIME_ZONE = 'America/Vancouver';

interface RawLibcalSlot {
  start: string; // "YYYY-MM-DD HH:mm:ss", naive local wall-clock time, no offset
  end: string;
  itemId: number;
  className?: string;
  [key: string]: unknown;
}

interface LibcalGridResponse {
  slots: RawLibcalSlot[];
  [key: string]: unknown;
}

// `lid`/`gid` are static per space (see fetchLidAndGid below), so successful lookups
// are cached for the lifetime of the module instance, keyed by `host:spaceId`. This
// avoids re-fetching and re-scraping the space page HTML on every sync call.
const lidGidCache = new Map<string, { lid: string; gid: string }>();

/**
 * LibCal's `/spaces/availability/grid` endpoint requires a `lid` (location id) and
 * `gid` (group id) alongside the `eid` (space/item id) — omitting either yields a
 * 400, and passing the wrong ones silently yields an empty result set. Neither is
 * derivable from `spaceId` alone, and the public `fetchLibcalSlots` signature is a
 * fixed interface contract that can't grow extra parameters, so this fetches the
 * space's own page HTML first and scrapes them out of the embedded `springyPage`
 * config object (e.g. `locationId: 1791,` / `groupId: 3208,`).
 */
async function fetchLidAndGid(host: string, spaceId: string): Promise<{ lid: string; gid: string }> {
  const cacheKey = `${host}:${spaceId}`;
  const cached = lidGidCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const pageUrl = `https://${host}/space/${spaceId}`;
  const response = await fetch(pageUrl, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Failed to load LibCal space page ${pageUrl}: ${response.status}`);
  }

  const html = await response.text();
  const lid = /\blocationId:\s*(\d+)/.exec(html)?.[1];
  const gid = /\bgroupId:\s*(\d+)/.exec(html)?.[1];

  if (!lid || !gid) {
    throw new Error(`Could not find locationId/groupId in LibCal space page ${pageUrl}`);
  }

  const result = { lid, gid };
  lidGidCache.set(cacheKey, result);
  return result;
}

// Constructing an Intl.DateTimeFormat is expensive (it resolves locale and zone data),
// and tzOffsetMinutes runs twice per slot, ~1k times per room for a two-week grid. Building
// one per call pushed a sync run past the Edge Function CPU limit, so formatters are
// cached per time zone for the lifetime of the module instance. They hold no state.
const tzFormatters = new Map<string, Intl.DateTimeFormat>();

function tzFormatter(timeZone: string): Intl.DateTimeFormat {
  let formatter = tzFormatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    tzFormatters.set(timeZone, formatter);
  }
  return formatter;
}

/**
 * Returns the offset (in minutes) between UTC and `timeZone` at instant `at`, defined
 * so that: utcMs = wallClockFieldsTreatedAsUtcMs - offsetMinutes * 60_000.
 * (For America/Vancouver in PDT this evaluates to -420; in PST, -480.)
 */
function tzOffsetMinutes(at: Date, timeZone: string): number {
  const parts = tzFormatter(timeZone).formatToParts(at);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const wallClockAsUtcMs = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );

  return (wallClockAsUtcMs - at.getTime()) / 60_000;
}

/**
 * LibCal returns naive "YYYY-MM-DD HH:mm:ss" timestamps with no UTC offset; they are
 * wall-clock time in the venue's local zone. Converts to a correct-instant ISO 8601
 * string, resolving PST vs. PDT dynamically via Intl instead of a hardcoded offset so
 * this stays correct across the DST boundary (verified empirically against a live
 * response on 2026-07-08, when America/Vancouver was in PDT/UTC-07:00).
 *
 * Implementation note: `guessUtcMs` treats the wall-clock fields as if they were UTC,
 * which is off by the zone's real offset (~7-8h) but close enough to land on the
 * correct side of the DST transition for any time within a venue's operating hours
 * (DST switches happen at 2am local, never during bookable hours). That's used only
 * to look up which offset rule applies; the actual instant is then computed exactly.
 */
export function libcalTimestampToISOString(timestamp: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(timestamp);
  if (!match) {
    throw new Error(`Unexpected LibCal timestamp format: ${timestamp}`);
  }

  const [year, month, day, hour, minute, second] = match.slice(1).map(Number);
  const guessUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);
  const offsetMinutes = tzOffsetMinutes(new Date(guessUtcMs), LIBCAL_TIME_ZONE);
  const utcMs = guessUtcMs - offsetMinutes * 60_000;

  return new Date(utcMs).toISOString();
}

/**
 * Returns the `[start, end)` calendar-day pair (both "YYYY-MM-DD") to request from the
 * grid endpoint. `start` is `date`'s calendar day in `timeZone`. `end` is the Monday after
 * next, so the window covers the rest of this Monday-based week plus all of next week,
 * the range the frontend's day picker offers. The grid endpoint returns a multi-day range
 * in one response, so this costs no extra requests.
 *
 * `date` is an instant (e.g. "now"), so its UTC calendar date can differ from its
 * Vancouver-local one. UTC midnight is ~5pm PDT / 4pm PST, so naively using
 * `date.toISOString()` would start the window tomorrow for any call made in the evening.
 *
 * `end` is derived from `start`'s date *components*, not by adding hours to the instant:
 * on the fall-back DST day (25 real hours long), adding 24h to an early-morning instant can
 * land back on the same local calendar date. Doing the arithmetic on the (year, month, day)
 * triple via `Date.UTC` sidesteps DST entirely, since UTC has no DST and `Date.UTC` rolls
 * over day/month/year overflow correctly.
 */
export function vancouverWindow(date: Date, timeZone: string): { start: string; end: string } {
  // The "en-CA" locale formats dates as YYYY-MM-DD, so this gives the local calendar
  // date directly without hand-assembling it from formatToParts.
  const start = new Intl.DateTimeFormat('en-CA', { timeZone }).format(date);

  const [year, month, day] = start.split('-').map(Number);
  // getUTCDay of the local triple at UTC midnight is that local date's weekday (0 = Sunday).
  const daysSinceMonday = (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
  const end = new Date(Date.UTC(year, month - 1, day - daysSinceMonday + 14)).toISOString().slice(0, 10);

  return { start, end };
}

/**
 * Maps LibCal's raw per-slot entries into this codebase's normalized Slot shape.
 *
 * The grid endpoint returns availability for every item in the room's group, not just
 * the requested one, so entries are filtered down to `itemId`.
 *
 * Booked vs. free: LibCal's own shipped JS (`createStartTimeToClassMap` /
 * `formatEventsForFullCalendar` in the space page) treats the mere *presence* of a
 * `className` on a slot as booked/unavailable, regardless of its value — confirmed
 * empirically, where both `s-lc-eq-r-unavailable` and `s-lc-eq-checkout` show up as
 * booked-slot markers across the two hosts. Its absence means free.
 */
function toSlots(entries: RawLibcalSlot[], itemId: number): Slot[] {
  return entries
    .filter((entry) => entry.itemId === itemId)
    .map((entry) => ({
      start: libcalTimestampToISOString(entry.start),
      end: libcalTimestampToISOString(entry.end),
      available: !entry.className,
    }));
}

/**
 * POSTs one grid request and returns its raw entries. The response covers every item in
 * the `lid`/`gid` group, not just `eid`; callers filter it with `toSlots`.
 */
async function fetchGrid(
  host: string,
  spaceId: string,
  lid: string,
  gid: string,
  start: string,
  end: string,
): Promise<RawLibcalSlot[]> {
  const body = new URLSearchParams({
    lid,
    gid,
    eid: spaceId,
    seat: '0',
    seatId: '0',
    zone: '0',
    start,
    end,
    pageIndex: '0',
    pageSize: '18',
  });

  const response = await fetch(`https://${host}/spaces/availability/grid`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'X-Requested-With': 'XMLHttpRequest',
      // LibCal rejects requests with no Referer ("Invalid Referrer."); it only checks
      // the host, not the exact path, but the real space page URL is the natural value.
      Referer: `https://${host}/space/${spaceId}`,
    },
    body: body.toString(),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`LibCal request failed for space ${spaceId} on ${host}: ${response.status}`);
  }

  const data: LibcalGridResponse = await response.json();
  return Array.isArray(data.slots) ? data.slots : [];
}

export type LibcalFetcher = (host: string, spaceId: string, date: Date) => Promise<Slot[]>;

/**
 * Returns a fetcher that shares one grid request per LibCal group and window across every
 * room it is asked for. A group's two-week grid is large (AMS: ~6k slots, ~800 KB) and is the
 * same whichever of its rooms asks, so fetching it once per room multiplied the load on
 * LibCal, which throttles bursts.
 *
 * Create one fetcher per sync run and drop it afterwards. The Edge Function's module
 * instance can stay warm across invocations, so a module-level cache would serve a stale
 * grid to the next run; a fetcher's cache lives only as long as the fetcher.
 *
 * The in-flight promise is shared, so rooms fetched concurrently still make one request.
 * The request carries the first room's `eid` and is paged (`pageSize: 18`), so it is not
 * guaranteed to include every other room in the group. Any room with no entries in the
 * shared response, or whose shared request failed, makes its own request instead, so
 * sharing can never drop a room's data.
 */
export function createLibcalFetcher(): LibcalFetcher {
  const grids = new Map<string, { eid: string; entries: Promise<RawLibcalSlot[]> }>();

  return async (host, spaceId, date) => {
    const { lid, gid } = await fetchLidAndGid(host, spaceId);
    const { start, end } = vancouverWindow(date, LIBCAL_TIME_ZONE);
    const itemId = Number(spaceId);
    const key = `${host}:${lid}:${gid}:${start}:${end}`;

    const shared = grids.get(key);
    if (!shared || shared.eid === spaceId) {
      const entries = shared?.entries ?? fetchGrid(host, spaceId, lid, gid, start, end);
      if (!shared) grids.set(key, { eid: spaceId, entries });
      return toSlots(await entries, itemId);
    }

    const sharedEntries = await shared.entries.catch(() => null);
    if (sharedEntries?.some((entry) => entry.itemId === itemId)) {
      return toSlots(sharedEntries, itemId);
    }
    return toSlots(await fetchGrid(host, spaceId, lid, gid, start, end), itemId);
  };
}

/** Fetches one room's slots with its own grid request (nothing shared). */
export function fetchLibcalSlots(host: string, spaceId: string, date: Date): Promise<Slot[]> {
  return createLibcalFetcher()(host, spaceId, date);
}
