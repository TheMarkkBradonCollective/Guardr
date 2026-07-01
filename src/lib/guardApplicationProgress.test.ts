import test from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityGuard } from '../types';
import { getGuardApplicationProgress } from './guardApplicationProgress';

function baseGuard(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'g1',
    name: 'Test Guard',
    email: 'guard@test.com',
    phone: '',
    badgeNumber: '',
    hourlyRateRequirement: 25,
    certifications: [],
    experience: [],
    education: [],
    userStatus: 'pending',
    verified: false,
    isStaff: false,
    ...overrides,
  } as SecurityGuard;
}

test('getGuardApplicationProgress returns 0% when nothing is on file', () => {
  const progress = getGuardApplicationProgress(baseGuard());
  assert.equal(progress.percent, 0);
  assert.equal(progress.completedRequirements, 0);
  assert.equal(progress.totalRequirements, 5);
});

test('getGuardApplicationProgress awards partial credit for submitted ID without verification', () => {
  const progress = getGuardApplicationProgress(
    baseGuard({
      idVerificationStatus: 'pending',
      idFrontUrl: 'https://example.com/front.jpg',
      idBackUrl: 'https://example.com/back.jpg',
      idSelfieUrl: 'https://example.com/selfie.jpg',
      idNumber: 'A1234567',
      idState: 'CA',
      idExpiryDate: '2030-01-01',
    })
  );
  assert.ok(progress.percent > 0);
  assert.ok(progress.percent <= 20);
});
