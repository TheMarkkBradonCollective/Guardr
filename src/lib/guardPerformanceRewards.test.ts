import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildPerformanceRewardsSummary, rewardsForTier } from './guardPerformanceRewards';
import { computeGuardPerformanceRating } from './guardPerformance';
import type { SecurityGuard } from '../types';

function guard(): SecurityGuard {
  return {
    id: 'g1',
    name: 'Test Guard',
    email: 'guard@test.com',
    badgeNumber: '1',
    avatar: '',
    phone: '',
    bio: '',
    isArmed: false,
    jobsCompleted: 5,
    userStatus: 'active',
    isStaff: false,
  } as SecurityGuard;
}

describe('guardPerformanceRewards', () => {
  it('returns tier reward packs with unlock state', () => {
    const rating = computeGuardPerformanceRating(guard(), []);
    const summary = buildPerformanceRewardsSummary(rating);
    assert.ok(summary.sections.length >= 4);
    assert.ok(rewardsForTier('elite').length > 0);
    assert.equal(summary.sections[0].unlocked, true);
    const allRewardIds = summary.sections.flatMap((section) => section.items.map((item) => item.id));
    assert.equal(allRewardIds.includes('trusted-path'), false);
    assert.equal(allRewardIds.includes('crew-lead'), false);
  });
});
