import test from 'node:test';
import assert from 'node:assert/strict';
import { assertTzdata } from './tzGuard';

test('rejects tzdata older than 2026c (pre B.C. permanent UTC-7)', () => {
  assert.throws(() => assertTzdata('2026a'), /Outdated time zone data: tzdata 2026a < 2026c/);
});

test('accepts tzdata 2026c and later', () => {
  assert.doesNotThrow(() => assertTzdata('2026c'));
  assert.doesNotThrow(() => assertTzdata('2027a'));
});

test('rejects a runtime that reports no tzdata version', () => {
  assert.throws(() => assertTzdata(undefined), /Outdated time zone data/);
});
