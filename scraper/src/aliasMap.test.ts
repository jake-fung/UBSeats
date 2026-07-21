import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveLocation } from './aliasMap';

test('splits a "<CODE> <room>" location into building code and room number', () => {
  assert.deepEqual(resolveLocation('ALRD B101'), { bldgCode: 'ALRD', roomNumber: 'B101' });
  assert.deepEqual(resolveLocation('BIOL 1000'), { bldgCode: 'BIOL', roomNumber: '1000' });
});

test('uppercases code and room and strips inner whitespace from the room', () => {
  assert.deepEqual(resolveLocation('buch a101'), { bldgCode: 'BUCH', roomNumber: 'A101' });
  assert.deepEqual(resolveLocation('DMP  110'), { bldgCode: 'DMP', roomNumber: '110' });
});

test('uses the already-corrected codes the timetable emits', () => {
  // The Location column uses IBLC / MCML directly, not the old IKB / MCLM.
  assert.equal(resolveLocation('IBLC 182')?.bldgCode, 'IBLC');
  assert.equal(resolveLocation('MCML 166')?.bldgCode, 'MCML');
});

test('returns null for anything that is not "<code> <room>"', () => {
  assert.equal(resolveLocation('Buchanan'), null); // single token, no room
  assert.equal(resolveLocation('ALRD'), null); // code but no room
  assert.equal(resolveLocation('Mystery Hall-101'), null); // first token > 6 chars, not a code
  assert.equal(resolveLocation(''), null);
});
