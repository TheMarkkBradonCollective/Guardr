import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPerformanceBreakdown,
  buildPerformanceFactors,
  computeClientReviewStats,
  computeGuardPerformance,
  computeGuardPerformanceRating,
  computeGuardSkillRatings,
  formatReviewCount,
  formatShiftSampleCount,
  formatViolationSummary,
  getPerformanceTier,
  getNextPerformanceTier,
} from './guardPerformance.ts';
import type { SecurityGuard, SecurityRequest } from '../types.ts';

function completedJob(overrides: Partial<SecurityRequest> = {}): SecurityRequest {
  return {
    id: 'job-1',
    title: 'Event Security',
    type: 'event',
    status: 'completed',
    assignedGuardId: 'guard-1',
    startDate: '2026-01-01T18:00:00',
    endDate: '2026-01-01T22:00:00',
    location: 'LA',
    clientId: 'client-1',
    clientName: 'Client',
    hourlyRate: 30,
    guardPay: 25,
    durationHours: 4,
    estimatedPayout: 100,
    ...overrides,
  } as SecurityRequest;
}

test('computeClientReviewStats averages ratingGiven on completed jobs', () => {
  const requests = [
    completedJob({ id: 'j1', ratingGiven: 5 }),
    completedJob({ id: 'j2', ratingGiven: 4 }),
    completedJob({ id: 'j3', status: 'open' }),
  ];
  const stats = computeClientReviewStats('guard-1', requests);
  assert.equal(stats.count, 2);
  assert.equal(stats.average, 4.5);
});

test('buildPerformanceBreakdown includes client reviews and behavior rows', () => {
  const requests = [
    completedJob({
      id: 'j1',
      ratingGiven: 5,
      checkInAudit: {
        checkedAt: '2026-01-01T17:55:00',
        uniform: {
          uniformPresent: true,
          blackShoes: true,
          dutyBelt: true,
          nameBadge: true,
          professionalAppearance: true,
        },
        equipment: { radio: true, flashlight: true, requiredEquipment: true },
        selfieUpload: 'selfie.jpg',
        gpsVerified: true,
      },
    }),
  ];
  const metrics = computeGuardPerformance('guard-1', requests);
  const clientReviews = computeClientReviewStats('guard-1', requests);
  const rows = buildPerformanceBreakdown(metrics, clientReviews);

  assert.ok(rows.some((r) => r.id === 'client-reviews'));
  assert.ok(rows.some((r) => r.id === 'on-time'));
  assert.ok(rows.some((r) => r.id === 'check-ins'));
  assert.equal(rows.find((r) => r.id === 'client-reviews')?.score, 5);
});

test('formatReviewCount pluralizes correctly', () => {
  assert.equal(formatReviewCount(0), 'No client reviews yet');
  assert.equal(formatReviewCount(1), 'Based on 1 client review');
  assert.equal(formatReviewCount(12), 'Based on 12 client reviews');
});

test('formatShiftSampleCount pluralizes correctly', () => {
  assert.equal(formatShiftSampleCount(0), 'No completed shifts yet');
  assert.equal(formatShiftSampleCount(1), '1 completed shift analyzed');
  assert.equal(formatShiftSampleCount(3), '3 completed shifts analyzed');
});

const baseGuard = {
  id: 'guard-1',
  name: 'Test Guard',
  rating: 4.5,
  jobsCompleted: 5,
  isArmed: false,
  backgroundChecked: true,
  verified: true,
  certifications: [],
  experience: [],
} as SecurityGuard;

test('getPerformanceTier maps score to Rising / Professional / Elite', () => {
  assert.equal(getPerformanceTier(50).name, 'Starting');
  assert.equal(getPerformanceTier(60).name, 'Rising');
  assert.equal(getPerformanceTier(75).name, 'Professional');
  assert.equal(getPerformanceTier(85).name, 'Elite');
});

test('getNextPerformanceTier returns next threshold', () => {
  assert.equal(getNextPerformanceTier(50)?.name, 'Rising');
  assert.equal(getNextPerformanceTier(84)?.name, 'Elite');
  assert.equal(getNextPerformanceTier(95), null);
});

test('buildPerformanceFactors sums to overall rating components', () => {
  const requests = [
    completedJob({
      id: 'j1',
      ratingGiven: 5,
      applicants: ['guard-1'],
      checkInAudit: {
        checkedAt: '2026-01-01T17:55:00',
        uniform: {
          uniformPresent: true,
          blackShoes: true,
          dutyBelt: true,
          nameBadge: true,
          professionalAppearance: true,
        },
        equipment: { radio: true, flashlight: true, requiredEquipment: true },
        selfieUpload: 'selfie.jpg',
        gpsVerified: true,
      },
    }),
  ];
  const metrics = computeGuardPerformance('guard-1', requests);
  const clientReviews = computeClientReviewStats('guard-1', requests);
  const factors = buildPerformanceFactors('guard-1', metrics, clientReviews, requests);

  assert.ok(factors.some((f) => f.id === 'acceptance'));
  assert.ok(factors.some((f) => f.id === 'completion'));
  assert.ok(factors.some((f) => f.id === 'on-time'));
  assert.ok(factors.some((f) => f.id === 'client-rating'));

  const total = factors.reduce((sum, f) => sum + f.pointsEarned, 0);
  assert.ok(total > 0 && total <= 100);
});

test('computeGuardPerformanceRating includes tier and violations', () => {
  const requests = [
    completedJob({ id: 'j1', applicants: ['guard-1'], noShow: true }),
    completedJob({
      id: 'j2',
      applicants: ['guard-1'],
      ratingGiven: 4,
      clientViolationReports: [
        {
          id: 'v1',
          target: 'guard',
          category: 'uniform',
          description: 'Wrong shoes',
          reportedAt: '2026-01-02T12:00:00Z',
          reportedByClientId: 'client-1',
          guardId: 'guard-1',
        },
      ],
    }),
  ];
  const guard = { ...baseGuard, failedAudits: 1 };
  const rating = computeGuardPerformanceRating(guard, requests);

  assert.ok(rating.overallRating >= 0);
  assert.ok(rating.tier);
  assert.ok(rating.factors.length >= 4);
  assert.ok(rating.violations.length >= 3);
  assert.ok(rating.violations.some((v) => v.id === 'client-reported'));
  assert.equal(rating.violations.some((v) => v.id === 'incident'), false);
  assert.equal(formatViolationSummary(rating.violations).includes('violation'), true);
});

test('computeGuardSkillRatings can include every job type', () => {
  const guard = { ...baseGuard, rating: 4.5 };
  const ratings = computeGuardSkillRatings(guard, [], { includeAllJobTypes: true });
  assert.equal(ratings.length, 15);
  assert.ok(ratings.every((row) => row.reviewCount === 0));
  assert.ok(ratings.some((row) => row.skill === 'Nightclub & bar'));
});
