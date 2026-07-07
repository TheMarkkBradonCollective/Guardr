import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkRateLimit } from './rateLimit.ts';

test('checkRateLimit allows requests within window', () => {
  const config = { windowMs: 60_000, maxRequests: 3 };
  assert.equal(checkRateLimit('test-key-a', config).allowed, true);
  assert.equal(checkRateLimit('test-key-a', config).allowed, true);
  assert.equal(checkRateLimit('test-key-a', config).allowed, true);
  assert.equal(checkRateLimit('test-key-a', config).allowed, false);
});

test('checkRateLimit isolates keys', () => {
  const config = { windowMs: 60_000, maxRequests: 1 };
  assert.equal(checkRateLimit('key-1', config).allowed, true);
  assert.equal(checkRateLimit('key-2', config).allowed, true);
});
