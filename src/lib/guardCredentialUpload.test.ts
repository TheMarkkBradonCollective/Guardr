import test from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityGuard } from '../types';
import { canUploadGuardCredentials } from './guardCredentialUpload';

function baseGuard(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'g1',
    name: 'Test Guard',
    email: 'guard@test.com',
    userStatus: 'pending',
    isStaff: false,
    certifications: [],
    ...overrides,
  } as SecurityGuard;
}

test('canUploadGuardCredentials allows pending guards to upload', () => {
  assert.equal(
    canUploadGuardCredentials(true, false, () => undefined, baseGuard({ userStatus: 'pending' })),
    true
  );
});

test('canUploadGuardCredentials allows approved guards to upload', () => {
  assert.equal(
    canUploadGuardCredentials(true, false, () => undefined, baseGuard({ userStatus: 'approved' })),
    true
  );
});

test('canUploadGuardCredentials blocks active guards from self-upload path', () => {
  assert.equal(
    canUploadGuardCredentials(true, false, () => undefined, baseGuard({ userStatus: 'active' })),
    false
  );
});

test('canUploadGuardCredentials always allows staff mode', () => {
  assert.equal(
    canUploadGuardCredentials(false, true, () => undefined, baseGuard({ userStatus: 'pending' })),
    true
  );
});
