import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveLocation, SCIENTIA_BUILDING_TO_CODE } from './aliasMap';

test('resolves hyphen-separated location names', () => {
  assert.deepEqual(resolveLocation('Buchanan-A101'), { bldgCode: 'BUCH', roomNumber: 'A101' });
});

test('resolves space-separated location names', () => {
  assert.deepEqual(resolveLocation('Hennings 201'), { bldgCode: 'HENN', roomNumber: '201' });
});

test('prefers the longest building-name prefix', () => {
  assert.deepEqual(resolveLocation('Mathematics Annex-1102'), { bldgCode: 'MATX', roomNumber: '1102' });
  assert.deepEqual(resolveLocation('Mathematics-100'), { bldgCode: 'MATH', roomNumber: '100' });
});

test('maps renamed codes to UBSeats bldg_code values', () => {
  assert.equal(resolveLocation('Irving K. Barber Learning Ctr-182')?.bldgCode, 'IBLC');
  assert.equal(resolveLocation('MacMillan-166')?.bldgCode, 'MCML');
});

test('returns null for unknown buildings and bare names without a room', () => {
  assert.equal(resolveLocation('Totally Unknown Hall-101'), null);
  assert.equal(resolveLocation('Buchanan'), null);
});

test('every mapped code is a real UBSeats bldg_code format', () => {
  for (const code of Object.values(SCIENTIA_BUILDING_TO_CODE)) {
    assert.match(code, /^[A-Z0-9]{2,5}$/);
  }
});
