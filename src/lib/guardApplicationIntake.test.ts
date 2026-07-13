import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  guardArmedPreferenceFromSignup,
  guardArmedPreferenceLabel,
  guardCardStatusLabel,
  guardHasApplicationIntake,
} from './guardApplicationIntake.ts';
import type { SecurityGuard } from '../types.ts';

function baseGuard(partial: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'g-1',
    name: 'Test Guard',
    email: 'guard@example.com',
    badgeNumber: 'GR-10001',
    avatar: '',
    phone: '555-0100',
    bio: 'Background',
    isArmed: false,
    backgroundChecked: false,
    verified: false,
    rating: 0,
    jobsCompleted: 0,
    certifications: [],
    experience: [],
    ...partial,
  };
}

describe('guardApplicationIntake', () => {
  it('maps armed signup preferences', () => {
    assert.deepEqual(guardArmedPreferenceFromSignup('unarmed'), {
      isArmed: false,
      armedPreference: 'unarmed',
    });
    assert.deepEqual(guardArmedPreferenceFromSignup('both'), {
      isArmed: true,
      armedPreference: 'both',
    });
  });

  it('labels armed preference from stored field', () => {
    assert.equal(guardArmedPreferenceLabel(baseGuard({ armedPreference: 'both' })), 'Armed & unarmed');
    assert.equal(guardArmedPreferenceLabel(baseGuard({ isArmed: true })), 'Armed');
  });

  it('labels guard card status', () => {
    assert.equal(guardCardStatusLabel('active'), 'Active CA guard card on hand');
  });

  it('detects application intake data', () => {
    assert.equal(guardHasApplicationIntake(baseGuard()), false);
    assert.equal(guardHasApplicationIntake(baseGuard({ yearsExperience: 2 })), true);
  });
});
