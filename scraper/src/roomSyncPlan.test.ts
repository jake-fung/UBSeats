import test from 'node:test';
import assert from 'node:assert/strict';
import { planRoomSync, type ExistingRoom, type ScrapedRoom } from './roomSyncPlan';

const buildings = new Map([
  ['BUCH', 'b-buch'],
  ['IBLC', 'b-iblc'],
]);

const scraped = (over: Partial<ScrapedRoom> = {}): ScrapedRoom => ({
  source_key: 'BUCH-A101',
  bldg_code: 'BUCH',
  room_number: 'A101',
  ...over,
});

test('matches an existing room by source_key', () => {
  const existing: ExistingRoom[] = [{ uuid: 'r1', building_uuid: 'b-buch', room_name: 'BUCH – Room A101', source_key: 'BUCH-A101' }];
  const plan = planRoomSync([scraped()], existing, buildings);
  assert.equal(plan.matched.get('BUCH-A101'), 'r1');
  assert.deepEqual(plan.toInsert, []);
  assert.deepEqual(plan.skippedManual, []);
});

test('skips rooms that exist as manual rows (no source_key) with the same trailing room token', () => {
  const existing: ExistingRoom[] = [{ uuid: 'lib1', building_uuid: 'b-iblc', room_name: 'Room 182', source_key: null }];
  const plan = planRoomSync([scraped({ source_key: 'IBLC-182', bldg_code: 'IBLC', room_number: '182' })], existing, buildings);
  assert.equal(plan.matched.size, 0);
  assert.deepEqual(plan.toInsert, []);
  assert.deepEqual(plan.skippedManual, [{ source_key: 'IBLC-182', existingRoomUuid: 'lib1' }]);
});

test('queues unknown rooms for insertion, deduplicated by source_key', () => {
  const plan = planRoomSync([scraped(), scraped()], [], buildings);
  assert.deepEqual(plan.toInsert, [scraped()]);
});

test('throws when a bldg_code is missing from the buildings table', () => {
  assert.throws(() => planRoomSync([scraped({ bldg_code: 'NOPE', source_key: 'NOPE-1', room_number: '1' })], [], buildings), /NOPE/);
});
