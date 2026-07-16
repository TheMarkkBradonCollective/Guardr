import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PREMIUM_GUARD_PAY_THRESHOLD,
  buildJobTypePremiumPriorityProgress,
  guardHasPremiumJobPriority,
  isPremiumOpenJob,
  premiumJobMatchingWeight,
} from './guardPremiumJobPriority.ts';
import { buildJobTypeRatingCards } from './guardJobTypeRatingMetrics.ts';
import type { SecurityRequest } from '../types.ts';

function completedJob(overrides: Partial<SecurityRequest> = {}): SecurityRequest {
  return {
    id: 'job-1',
    title: 'Corporate event',
    type: 'event-corporate',
    status: 'completed',
    assignedGuardId: 'guard-1',
    startDate: '2026-01-01T18:00:00',
    endDate: '2026-01-01T22:00:00',
    location: 'LA',
    clientId: 'client-1',
    clientName: 'Client',
    hourlyRate: 40,
    guardPay: 35,
    durationHours: 4,
    estimatedPayout: 140,
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
    ratingGiven: 5,
    ...overrides,
  } as SecurityRequest;
}

test('isPremiumOpenJob detects high pay, multi-guard, and crew jobs', () => {
  assert.equal(isPremiumOpenJob({ guardPay: 35, guardsNeeded: 1, type: 'event' }), true);
  assert.equal(isPremiumOpenJob({ guardPay: 20, guardsNeeded: 3, type: 'event' }), true);
  assert.equal(
    isPremiumOpenJob({ guardPay: 25, guardsNeeded: 1, teamLeadId: 'lead-1', type: 'event' }),
    true
  );
  assert.equal(isPremiumOpenJob({ guardPay: 25, guardsNeeded: 1, type: 'event' }), false);
  assert.equal(PREMIUM_GUARD_PAY_THRESHOLD, 35);
});

test('buildJobTypePremiumPriorityProgress counts met rating targets', () => {
  const cards = buildJobTypeRatingCards('guard-1', 'event-corporate', []);
  const progress = buildJobTypePremiumPriorityProgress('event-corporate', cards);

  assert.equal(progress.metCount, 0);
  assert.equal(progress.totalCount, cards.length);
  assert.equal(progress.isQualified, false);
  assert.equal(progress.targets.length, cards.length);
});

test('guardHasPremiumJobPriority is true when all targets are met', () => {
  const requests = Array.from({ length: 5 }, (_, index) =>
    completedJob({ id: `job-${index}`, ratingGiven: 5 })
  );
  assert.equal(guardHasPremiumJobPriority('guard-1', 'event-corporate', requests), true);
});

test('premiumJobMatchingWeight boosts qualified guards on premium jobs only', () => {
  const requests = Array.from({ length: 5 }, (_, index) =>
    completedJob({ id: `job-${index}`, ratingGiven: 5 })
  );
  const premiumJob = { guardPay: 40, guardsNeeded: 1, type: 'event-corporate' as const };
  const standardJob = { guardPay: 25, guardsNeeded: 1, type: 'event-corporate' as const };

  assert.equal(premiumJobMatchingWeight('guard-1', premiumJob, requests), 100);
  assert.equal(premiumJobMatchingWeight('guard-1', standardJob, requests), 0);
  assert.equal(premiumJobMatchingWeight('guard-1', premiumJob, []), 0);
});
