# LibCal Room Availability — Follow-ups

Deferred findings from the 2026-07-09 final branch review of
`2026-07-05-libcal-room-availability.md`. The branch merged with these known
and accepted; none are regressions.

## 1. Closed buildings show green "Available now" (Important)

After a library closes, LibCal's grid endpoint returns zero remaining slots
for the day, and `parseAvailability([], now)` returns
`isAvailableNow: true` per the plan's Task 2 semantics ("no slots at all →
available now, no bounds"). Result: evening checks showed 40/49 rooms with a
green "Available now" badge inside closed buildings. Mitigated today only by
the building header's separate "Closed · Opens at 7:30am" indicator.

**Fix direction (one-condition change, no calculator/test changes):** in
`supabase/functions/sync-libcal-availability/index.ts` `processRoom`, when
`fetchLibcalSlots` returns an empty array, delete the room's
`room_availability` row instead of upserting "available". The badge then
disappears for the rest of the day and reappears on the first sync after
opening. Requires redeploying the Edge Function.

## 2. `pageSize: "18"` truncation insurance (Minor)

`libcalClient.ts` requests the grid with `pageSize: "18"`. All 7 current
LibCal groups have 4–13 items (verified live; responses at 18 vs 100 are
byte-identical), but a group growing past 18 spaces would silently truncate
slots → empty array for some rooms → the same false-green pathology as #1.
Bump to `"100"` next time the adapter is touched.

## 3. Sync failures are invisible from the outside (Minor)

`index.ts` returns `{processed: N}` and HTTP 200 even if every room failed;
errors go only to `console.error`. pg_net records response bodies, so
returning `{processed, failed}` would make degradation visible with plain
SQL against `net._http_response`.

## 4. Sync endpoint is publicly triggerable (Minor)

The function is invoked with the anon key, which ships in the frontend
bundle, so anyone can trigger a sync (2×49 upstream requests per cold call)
and could get Supabase's egress IPs rate-limited by LibCal. A Vault-stored
shared-secret header checked in the handler would close this. Design was
plan-specified; fine for current exposure.

## 5. Staleness uses the client clock (Note, accepted)

`fetchRoomAvailability` compares server `checked_at` to `Date.now()` on the
client; a skewed client clock hides badges (fast skew) or shows slightly
stale ones (slow skew). Fails toward hiding data — acceptable by design.
