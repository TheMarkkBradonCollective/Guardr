import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPerformanceBreakdown,
  computeClientReviewStats,
  formatReviewCount,
  formatShiftSampleCount,
  computeGuardPerformance,
} from './guardPerformance.ts';
import type { SecurityRequest } from '../types.ts';

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
        uniform: { uniformPresent: true, blackShoes: true, professionalAppearance: true },
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
