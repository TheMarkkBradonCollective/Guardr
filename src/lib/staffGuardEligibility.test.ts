import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityGuard } from '../types';
import { buildStaffGuardStatRows } from './staffStats';
import {
  buildStaffGuardEligibilityRecommendations,
  isTrustedEligible,
} from './staffGuardEligibility';

function guard(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'g1',
    name: 'Test Guard',
    email: 'guard@test.com',
    badgeNumber: 'G1',
    avatar: '',
    phone: '',
    bio: '',
    isArmed: false,
    jobsCompleted: 12,
    userStatus: 'active',
    verified: true,
    isStaff: false,
    ...overrides,
  } as SecurityGuard;
}

describe('staffGuardEligibility', () => {
  it('recommends trusted status for professional-tier guards with clean records', () => {
    const guards = [guard()];
    const [row] = buildStaffGuardStatRows(guards, []);
    const boosted = { ...row, overallRating: 80, tier: { ...row.tier, id: 'professional', name: 'Professional', level: 2, threshold: 75 } };
    assert.equal(isTrustedEligible(guards[0], boosted), true);

    const recs = buildStaffGuardEligibilityRecommendations(guards, [boosted]);
    assert.equal(recs.length, 1);
    assert.equal(recs[0].kind, 'trusted');
  });

  it('does not recommend trusted when guard is already trusted or below professional tier', () => {
    const guards = [guard({ trusted: true })];
    const [row] = buildStaffGuardStatRows(guards, []);
    const elite = { ...row, overallRating: 90, tier: { ...row.tier, id: 'elite', name: 'Elite', level: 3, threshold: 85 } };
    assert.equal(isTrustedEligible(guards[0], elite), false);

    const low = { ...row, overallRating: 70, tier: { ...row.tier, id: 'rising', name: 'Rising', level: 1, threshold: 60 } };
    assert.equal(isTrustedEligible(guard(), low), false);
  });
});
