import { assertEquals, assertRejects, assertThrows } from 'jsr:@std/assert';
import { createLibcalFetcher, fetchLibcalSlots, libcalTimestampToISOString, vancouverWindow } from './libcalClient.ts';

const TZ = 'America/Vancouver';

// Instants are UTC; the comments give the Vancouver wall-clock time they represent.

Deno.test('mid-week: runs from today to the Monday after next', () => {
  // Tue 2026-09-22 12:00 PDT
  assertEquals(vancouverWindow(new Date('2026-09-22T19:00:00Z'), TZ), {
    start: '2026-09-22',
    end: '2026-10-05',
  });
});

Deno.test('on a Monday: covers the full two weeks (14 days)', () => {
  // Mon 2026-09-21 12:00 PDT
  assertEquals(vancouverWindow(new Date('2026-09-21T19:00:00Z'), TZ), {
    start: '2026-09-21',
    end: '2026-10-05',
  });
});

Deno.test('on a Sunday: covers today plus all of next week (8 days)', () => {
  // Sun 2026-09-27 12:00 PDT
  assertEquals(vancouverWindow(new Date('2026-09-27T19:00:00Z'), TZ), {
    start: '2026-09-27',
    end: '2026-10-05',
  });
});

Deno.test('in the evening: uses the Vancouver date, not the UTC date', () => {
  // Tue 2026-09-22 21:30 PDT == Wed 2026-09-23 04:30 UTC
  assertEquals(vancouverWindow(new Date('2026-09-23T04:30:00Z'), TZ), {
    start: '2026-09-22',
    end: '2026-10-05',
  });
});

Deno.test('across the DST fall-back (2026-11-01): end is still the Monday after next', () => {
  // Fri 2026-10-30 12:00 PDT
  assertEquals(vancouverWindow(new Date('2026-10-30T19:00:00Z'), TZ), {
    start: '2026-10-30',
    end: '2026-11-09',
  });
});

Deno.test('just after the DST fall-back: Monday 00:30 PST starts a fresh 14-day window', () => {
  // Mon 2026-11-02 00:30 PST == 2026-11-02 08:30 UTC
  assertEquals(vancouverWindow(new Date('2026-11-02T08:30:00Z'), TZ), {
    start: '2026-11-02',
    end: '2026-11-16',
  });
});

Deno.test('libcalTimestampToISOString: a PDT wall-clock time is UTC-07:00', () => {
  assertEquals(libcalTimestampToISOString('2026-09-22 09:00:00'), '2026-09-22T16:00:00.000Z');
});

Deno.test('libcalTimestampToISOString: a PST wall-clock time is UTC-08:00', () => {
  assertEquals(libcalTimestampToISOString('2026-11-02 09:00:00'), '2026-11-02T17:00:00.000Z');
});

Deno.test('libcalTimestampToISOString: a malformed timestamp throws', () => {
  assertThrows(() => libcalTimestampToISOString('2026-09-22T09:00:00'), Error, 'Unexpected LibCal timestamp format');
});

// --- Per-run grid sharing (no network: globalThis.fetch is stubbed per test) ---

const HOST = 'libcal.example.test';
const NOW = new Date('2026-09-22T19:00:00Z'); // Tue 2026-09-22 12:00 PDT

function rawSlot(itemId: number, hour: number, booked = false) {
  const h = String(hour).padStart(2, '0');
  return {
    itemId,
    start: `2026-09-22 ${h}:00:00`,
    end: `2026-09-22 ${h}:30:00`,
    ...(booked ? { className: 's-lc-eq-r-unavailable' } : {}),
  };
}

/**
 * Stubs fetch for the space page (every space is in lid 1 / gid 2) and the grid endpoint.
 * `gridFor(eid)` gives the grid entries a POST with that `eid` returns (throw to fail it).
 * Returns the `eid` of every grid POST made, in order.
 */
async function withStubbedLibcal(gridFor: (eid: string) => unknown[], run: () => Promise<void>): Promise<string[]> {
  const gridPosts: string[] = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = (input: string | URL | Request, init?: RequestInit): Promise<Response> => {
    const url = String(input);
    if (url.endsWith('/spaces/availability/grid')) {
      const eid = new URLSearchParams(String(init?.body)).get('eid')!;
      gridPosts.push(eid);
      try {
        return Promise.resolve(Response.json({ slots: gridFor(eid) }));
      } catch {
        return Promise.resolve(new Response('throttled', { status: 429 }));
      }
    }
    return Promise.resolve(new Response('springyPage = { locationId: 1, groupId: 2, };'));
  };
  try {
    await run();
  } finally {
    globalThis.fetch = realFetch;
  }
  return gridPosts;
}

// A grid that, whichever eid asked, carries both rooms 101 and 102 of the group.
const fullGroupGrid = () => [rawSlot(101, 9), rawSlot(102, 9, true), rawSlot(101, 10, true)];

Deno.test('createLibcalFetcher: two rooms in one group share a single grid POST', async () => {
  const posts = await withStubbedLibcal(fullGroupGrid, async () => {
    const fetchSlots = createLibcalFetcher();
    const [a, b] = await Promise.all([fetchSlots(HOST, '101', NOW), fetchSlots(HOST, '102', NOW)]);
    assertEquals(a, [
      { start: '2026-09-22T16:00:00.000Z', end: '2026-09-22T16:30:00.000Z', available: true },
      { start: '2026-09-22T17:00:00.000Z', end: '2026-09-22T17:30:00.000Z', available: false },
    ]);
    assertEquals(b, [{ start: '2026-09-22T16:00:00.000Z', end: '2026-09-22T16:30:00.000Z', available: false }]);
  });
  assertEquals(posts, ['101']);
});

Deno.test('createLibcalFetcher: a room missing from the shared grid falls back to its own POST', async () => {
  // Each response only carries the room that asked for it.
  const posts = await withStubbedLibcal(
    (eid) => [rawSlot(Number(eid), 9)],
    async () => {
      const fetchSlots = createLibcalFetcher();
      await fetchSlots(HOST, '101', NOW);
      const b = await fetchSlots(HOST, '102', NOW);
      assertEquals(b, [{ start: '2026-09-22T16:00:00.000Z', end: '2026-09-22T16:30:00.000Z', available: true }]);
    },
  );
  assertEquals(posts, ['101', '102']);
});

Deno.test("createLibcalFetcher: a failed shared grid falls back to the room's own POST", async () => {
  const posts = await withStubbedLibcal(
    (eid) => {
      if (eid === '101') throw new Error('throttled');
      return fullGroupGrid();
    },
    async () => {
      const fetchSlots = createLibcalFetcher();
      await assertRejects(() => fetchSlots(HOST, '101', NOW), Error, 'LibCal request failed for space 101');
      const b = await fetchSlots(HOST, '102', NOW);
      assertEquals(b.length, 1);
    },
  );
  assertEquals(posts, ['101', '102']);
});

Deno.test('createLibcalFetcher: separate fetchers (separate sync runs) never share a grid', async () => {
  const posts = await withStubbedLibcal(fullGroupGrid, async () => {
    await createLibcalFetcher()(HOST, '101', NOW);
    await createLibcalFetcher()(HOST, '102', NOW);
  });
  assertEquals(posts, ['101', '102']);
});

Deno.test('fetchLibcalSlots: each call makes its own grid POST', async () => {
  const posts = await withStubbedLibcal(fullGroupGrid, async () => {
    const a = await fetchLibcalSlots(HOST, '101', NOW);
    const b = await fetchLibcalSlots(HOST, '102', NOW);
    assertEquals([a.length, b.length], [2, 1]);
  });
  assertEquals(posts, ['101', '102']);
});
