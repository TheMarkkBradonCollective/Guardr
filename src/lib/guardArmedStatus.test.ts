import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SecurityGuard } from '../types';
import { computeGuardArmedStatus } from './guardArmedStatus';

function baseGuard(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'g1',
    name: 'Test Guard',
    email: 'g@test.com',
    badgeNumber: '1',
    avatar: '',
    phone: '',
    bio: '',
    isArmed: false,
    backgroundChecked: true,
    verified: true,
    rating: 4.5,
    jobsCompleted: 10,
    certifications: [],
    experience: [],
    listedWeaponGear: [],
    ...overrides,
  };
}

describe('computeGuardArmedStatus', () => {
  it('returns unarmed when no listed gear', () => {
    assert.equal(computeGuardArmedStatus(baseGuard()), 'unarmed');
  });
});
