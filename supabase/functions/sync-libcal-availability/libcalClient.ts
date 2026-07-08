import type { Slot } from "./parseAvailability.ts";

const REQUEST_TIMEOUT_MS = 10_000;

// Both LibCal hosts this adapter targets (libcal.library.ubc.ca and amsubc.libcal.com)
// serve UBC Vancouver campus buildings, which are all in this IANA zone.
const LIBCAL_TIME_ZONE = "America/Vancouver";

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

  return { lid, gid };
}

/**
 * Returns the offset (in minutes) between UTC and `timeZone` at instant `at`, defined
 * so that: utcMs = wallClockFieldsTreatedAsUtcMs - offsetMinutes * 60_000.
 * (For America/Vancouver in PDT this evaluates to -420; in PST, -480.)
 */
function tzOffsetMinutes(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);

  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const wallClockAsUtcMs = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
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
function libcalTimestampToISOString(timestamp: string): string {
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

export async function fetchLibcalSlots(host: string, spaceId: string, date: Date): Promise<Slot[]> {
  const { lid, gid } = await fetchLidAndGid(host, spaceId);

  const start = date.toISOString().slice(0, 10); // YYYY-MM-DD
  const end = new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const body = new URLSearchParams({
    lid,
    gid,
    eid: spaceId,
    seat: "0",
    seatId: "0",
    zone: "0",
    start,
    end,
    pageIndex: "0",
    pageSize: "18",
  });

  const response = await fetch(`https://${host}/spaces/availability/grid`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
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
  return toSlots(Array.isArray(data.slots) ? data.slots : [], Number(spaceId));
}
