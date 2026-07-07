import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPasswordHash, isPasswordHash } from './passwordHash.ts';

test('hashPassword produces verifiable hash', async () => {
  const hash = await hashPassword('test-password-123');
  assert.ok(isPasswordHash(hash));
  assert.equal(await verifyPasswordHash(hash, 'test-password-123'), true);
  assert.equal(await verifyPasswordHash(hash, 'wrong'), false);
});

test('isPasswordHash rejects plaintext', () => {
  assert.equal(isPasswordHash('plaintext'), false);
  assert.equal(isPasswordHash('pbkdf2:120000:abc:def'), true);
});
