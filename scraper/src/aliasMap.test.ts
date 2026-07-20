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

test('commits to the longest matching prefix instead of falling through', () => {
  // Bare compound names whose longest match has no room remainder must resolve
  // to null, not fall through to a shorter prefix and misattribute the
  // remainder as a room number.
  assert.equal(resolveLocation('Buchanan Tower'), null);
  assert.equal(resolveLocation('Mathematics Annex'), null);
  assert.equal(resolveLocation('Auditorium Annex'), null);
  assert.equal(resolveLocation('Civil and Mechanical Eng. Labs'), null);

  // With-room cases on the same compound names must still resolve correctly.
  assert.deepEqual(resolveLocation('Buchanan Tower-2245'), { bldgCode: 'BUTO', roomNumber: '2245' });
  assert.deepEqual(resolveLocation('Mathematics Annex-1102'), { bldgCode: 'MATX', roomNumber: '1102' });
  assert.deepEqual(resolveLocation('Buchanan-A101'), { bldgCode: 'BUCH', roomNumber: 'A101' });
});

test('maps the remaining corrected codes to UBSeats bldg_code values', () => {
  assert.equal(resolveLocation('Koerner Pavilion-100')?.bldgCode, 'KPAV');
  assert.equal(resolveLocation('Detwiller Pavilion-100')?.bldgCode, 'DPAV');
  assert.equal(resolveLocation('Auditorium-100')?.bldgCode, 'AUDI');
  assert.equal(resolveLocation('Auditorium Annex'), null);
});
