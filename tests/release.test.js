import assert from 'node:assert/strict';
import { test } from 'node:test';
import { blockedFromProduction } from '../src/release.js';

const article = { slug: 'guide', hash: 'abc' };

test('verified content may go to production', () => {
  assert.deepEqual(blockedFromProduction([article], { hashes: { guide: 'abc' } }), []);
});

test('content that was never verified is blocked', () => {
  const never = 'never verified on staging';
  assert.deepEqual(blockedFromProduction([article], null), [{ slug: 'guide', reason: never }]);
  assert.deepEqual(blockedFromProduction([article], { hashes: {} }), [{ slug: 'guide', reason: never }]);
});

test('content edited after verification is blocked', () => {
  assert.deepEqual(blockedFromProduction([article], { hashes: { guide: 'old' } }), [
    { slug: 'guide', reason: 'changed after it was verified on staging' },
  ]);
});
