import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PREMIUM_GUARD_PAY_THRESHOLD,
  buildModalityPriorityProgress,
  guardHasModalityPriority,
  guardHasPremiumJobPriority,
  isPremiumOpenJob,
  modalityRewardsInfoCopy,
  premiumJobMatchingWeight,
} from './guardPremiumJobPriority.ts';
import { workModalityForJobType } from './guardWorkModality.ts';
import type { SecurityGuard, SecurityRequest } from '../types.ts';

const baseGuard = {
  id: 'guard-1',
  name: 'Guard One',
  jobsCompleted: 0,
  rating: 4.5,
} as SecurityGuard;

function completedJob(overrides: Partial<SecurityRequest> = {}): SecurityRequest {
  return {
    id: 'job-1',
    title: 'Corporate event',
    type: 'standing-guard',
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

test('isPremiumOpenJob detects high pay, multi-guard, and slotted jobs', () => {
  assert.equal(isPremiumOpenJob({ guardPay: 35, guardsNeeded: 1, type: 'event' }), true);
  assert.equal(isPremiumOpenJob({ guardPay: 20, guardsNeeded: 3, type: 'event' }), true);
  assert.equal(
    isPremiumOpenJob({
      guardPay: 25,
      guardsNeeded: 2,
      type: 'event',
      guardSlots: [{ id: 'job-1-slot-1', jobId: 'job-1', slotIndex: 1, isLead: true, status: 'open' }],
    }),
    true
  );
  assert.equal(isPremiumOpenJob({ guardPay: 25, guardsNeeded: 1, type: 'event' }), false);
  assert.equal(PREMIUM_GUARD_PAY_THRESHOLD, 35);
});

test('workModalityForJobType maps standing and driving job types', () => {
  assert.equal(workModalityForJobType('standing-guard'), 'standing');
  assert.equal(workModalityForJobType('foot-patrol'), 'standing');
  assert.equal(workModalityForJobType('vehicle-patrol'), 'driving');
  assert.equal(workModalityForJobType('patrol'), 'driving');
  assert.equal(workModalityForJobType('event-corporate'), null);
});

test('buildModalityPriorityProgress counts modality targets', () => {
  const progress = buildModalityPriorityProgress('standing', baseGuard, []);

  assert.equal(progress.metCount, 0);
  assert.ok(progress.totalCount >= 5);
  assert.equal(progress.isQualified, false);
  assert.ok(progress.progressLabel.includes('Standing priority'));
});

test('guardHasModalityPriority is true when all standing targets are met', () => {
  const guard = { ...baseGuard, jobsCompleted: 5 } as SecurityGuard;
  const requests = Array.from({ length: 5 }, (_, index) =>
    completedJob({ id: `job-${index}`, type: 'standing-guard', ratingGiven: 5 })
  );
  assert.equal(guardHasModalityPriority('standing', guard, requests), true);
});

test('guardHasPremiumJobPriority is modality-specific', () => {
  const guard = { ...baseGuard, jobsCompleted: 5 } as SecurityGuard;
  const requests = Array.from({ length: 5 }, (_, index) =>
    completedJob({ id: `job-${index}`, type: 'standing-guard', ratingGiven: 5 })
  );
  const standingPremiumJob = { guardPay: 40, guardsNeeded: 1, type: 'standing-guard' as const };
  const drivingPremiumJob = { guardPay: 40, guardsNeeded: 1, type: 'patrol' as const };

  assert.equal(guardHasPremiumJobPriority(guard, requests, standingPremiumJob), true);
  assert.equal(guardHasPremiumJobPriority(guard, requests, drivingPremiumJob), false);
});

test('premiumJobMatchingWeight boosts qualified guards on matching premium jobs only', () => {
  const guard = { ...baseGuard, jobsCompleted: 5 } as SecurityGuard;
  const requests = Array.from({ length: 5 }, (_, index) =>
    completedJob({ id: `job-${index}`, type: 'standing-guard', ratingGiven: 5 })
  );
  const standingPremiumJob = { guardPay: 40, guardsNeeded: 1, type: 'standing-guard' as const };
  const drivingPremiumJob = { guardPay: 40, guardsNeeded: 1, type: 'patrol' as const };

  assert.equal(premiumJobMatchingWeight(guard, standingPremiumJob, requests), 100);
  assert.equal(premiumJobMatchingWeight(guard, drivingPremiumJob, requests), 0);
});

test('modalityRewardsInfoCopy mentions standing and driving', () => {
  const standingCopy = modalityRewardsInfoCopy('standing', 6);
  const drivingCopy = modalityRewardsInfoCopy('driving', 6);
  assert.ok(standingCopy.title.toLowerCase().includes('standing'));
  assert.ok(drivingCopy.title.toLowerCase().includes('driving'));
  assert.ok(standingCopy.body.includes('$35'));
});
