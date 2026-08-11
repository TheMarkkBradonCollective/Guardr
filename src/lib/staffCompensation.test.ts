import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyStaffPayoutAdjustments,
  buildInstantBasePayout,
  buildStaffCompensationPreviews,
  DEFAULT_STAFF_COMPENSATION_CONFIG,
  getCompensationPeriodBounds,
  isPayoutAwaitingAdjustments,
  sumCollectedPlatformFeesInPeriod,
  totalRolePercent,
} from './staffCompensation';
import type { SecurityGuard, SecurityRequest } from '../types';

function makeRequest(overrides: Partial<SecurityRequest> = {}): SecurityRequest {
  return {
    id: 'job-1',
    title: 'Shift',
    description: 'Test',
    clientId: 'client-1',
    clientName: 'Client',
    clientLogo: '',
    location: 'LA',
    type: 'event',
    armedRequired: false,
    startDate: '2026-08-01T10:00:00.000Z',
    endDate: '2026-08-01T18:00:00.000Z',
    durationHours: 8,
    hourlyRate: 50,
    platformFeePerHour: 5,
    estimatedPayout: 400,
    status: 'completed',
    paymentStatus: 'released',
    clientPaymentMethod: 'stripe',
    assignedGuardId: 'guard-1',
    requiredCertifications: [],
    applicants: [],
    ...overrides,
  } as SecurityRequest;
}

function makeStaff(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'staff-1',
    name: 'Alex Support',
    email: 'alex@guardr.test',
    badgeNumber: 'S-1',
    avatar: '',
    phone: '',
    bio: '',
    isArmed: false,
    backgroundChecked: true,
    verified: true,
    rating: 5,
    jobsCompleted: 0,
    certifications: [],
    experience: [],
    hourlyRateRequirement: 0,
    isStaff: true,
    staffRole: 'Support',
    userStatus: 'active',
    ...overrides,
  };
}

test('sumCollectedPlatformFeesInPeriod counts stripe-paid jobs in range', () => {
  const { periodStart, periodEnd } = getCompensationPeriodBounds('weekly', new Date('2026-08-06T12:00:00.000Z'));
  const requests = [
    makeRequest({ id: 'a', endDate: '2026-08-05T18:00:00.000Z' }),
    makeRequest({ id: 'b', endDate: '2026-07-20T18:00:00.000Z' }),
  ];
  const total = sumCollectedPlatformFeesInPeriod(requests, periodStart, periodEnd);
  assert.equal(total, 40);
});

test('buildStaffCompensationPreviews splits role pool across peers', () => {
  const { periodStart, periodEnd } = getCompensationPeriodBounds('weekly', new Date('2026-08-06T12:00:00.000Z'));
  const requests = [makeRequest({ endDate: '2026-08-05T18:00:00.000Z' })];
  const guards = [
    makeStaff({ id: 's1', staffRole: 'Support' }),
    makeStaff({ id: 's2', name: 'Sam Support', email: 'sam@guardr.test', staffRole: 'Support' }),
  ];
  const previews = buildStaffCompensationPreviews({
    guards,
    requests,
    config: DEFAULT_STAFF_COMPENSATION_CONFIG,
    payouts: [],
    periodStart,
    periodEnd,
  });
  assert.equal(previews.length, 2);
  assert.equal(previews[0].platformFeesInPeriod, 40);
  // Support pool = round2(40 * 4.5%) = 1.8, split across 2 peers → 0.9 each
  assert.equal(previews[0].pendingAmount, 0.9);
  assert.equal(previews[1].pendingAmount, 0.9);
  assert.equal(previews[0].needsPeriodPayout, true);
});

test('default staff compensation allocates 50% of platform fees across roles', () => {
  assert.equal(totalRolePercent(DEFAULT_STAFF_COMPENSATION_CONFIG), 0.5);
  assert.equal(DEFAULT_STAFF_COMPENSATION_CONFIG.roleRules.Founder.percentOfFees, 0.115);
  assert.equal(DEFAULT_STAFF_COMPENSATION_CONFIG.roleRules.Director.percentOfFees, 0.105);
  assert.equal(DEFAULT_STAFF_COMPENSATION_CONFIG.roleRules.Manager.percentOfFees, 0.095);
  assert.equal(DEFAULT_STAFF_COMPENSATION_CONFIG.roleRules.Administrator.percentOfFees, 0.075);
  assert.equal(DEFAULT_STAFF_COMPENSATION_CONFIG.roleRules.Moderator.percentOfFees, 0.065);
});

test('buildStaffCompensationPreviews opens period payout when platform fees are zero', () => {
  const { periodStart, periodEnd } = getCompensationPeriodBounds('weekly', new Date('2026-08-06T12:00:00.000Z'));
  const previews = buildStaffCompensationPreviews({
    guards: [makeStaff()],
    requests: [],
    config: DEFAULT_STAFF_COMPENSATION_CONFIG,
    payouts: [],
    periodStart,
    periodEnd,
    trackedHoursByStaffId: { 'staff-1': 12.5 },
  });
  assert.equal(previews.length, 1);
  assert.equal(previews[0].platformFeesInPeriod, 0);
  assert.equal(previews[0].cappedBaseAmount, 0);
  assert.equal(previews[0].pendingAmount, 0);
  assert.equal(previews[0].needsPeriodPayout, true);
  assert.equal(previews[0].trackedHours, 12.5);
});

test('buildStaffCompensationPreviews respects confirmed payout for period', () => {
  const { periodStart, periodEnd } = getCompensationPeriodBounds('weekly', new Date('2026-08-06T12:00:00.000Z'));
  const previews = buildStaffCompensationPreviews({
    guards: [makeStaff()],
    requests: [makeRequest({ endDate: '2026-08-05T18:00:00.000Z' })],
    config: DEFAULT_STAFF_COMPENSATION_CONFIG,
    payouts: [
      {
        id: 'p1',
        staffId: 'staff-1',
        staffName: 'Alex Support',
        staffEmail: 'alex@guardr.test',
        staffRole: 'Support',
        periodStart,
        periodEnd,
        platformFeesInPeriod: 40,
        baseAmount: 0.6,
        adjustmentAmount: 0,
        finalAmount: 0.6,
        confirmedById: 'dir-1',
        confirmedByEmail: 'dir@guardr.test',
        confirmedAt: '2026-08-06T20:00:00.000Z',
      },
    ],
    periodStart,
    periodEnd,
  });
  assert.equal(previews[0].pendingAmount, 0);
  assert.equal(previews[0].needsPeriodPayout, false);
  assert.equal(previews[0].alreadyPaidAmount, 0.6);
});

test('buildInstantBasePayout creates base_paid record for instant revenue share', () => {
  const { periodStart, periodEnd } = getCompensationPeriodBounds('weekly', new Date('2026-08-06T12:00:00.000Z'));
  const previews = buildStaffCompensationPreviews({
    guards: [makeStaff()],
    requests: [makeRequest({ endDate: '2026-08-05T18:00:00.000Z' })],
    config: DEFAULT_STAFF_COMPENSATION_CONFIG,
    payouts: [],
    periodStart,
    periodEnd,
  });
  const payout = buildInstantBasePayout({ preview: previews[0], periodStart, periodEnd });
  assert.equal(payout.payoutStatus, 'base_paid');
  assert.equal(payout.finalAmount, payout.baseAmount);
  assert.equal(isPayoutAwaitingAdjustments(payout), true);
});

test('buildInstantBasePayout creates zero-dollar period anchor when fees are zero', () => {
  const { periodStart, periodEnd } = getCompensationPeriodBounds('weekly', new Date('2026-08-06T12:00:00.000Z'));
  const previews = buildStaffCompensationPreviews({
    guards: [makeStaff()],
    requests: [],
    config: DEFAULT_STAFF_COMPENSATION_CONFIG,
    payouts: [],
    periodStart,
    periodEnd,
  });
  const payout = buildInstantBasePayout({ preview: previews[0], periodStart, periodEnd });
  assert.equal(payout.baseAmount, 0);
  assert.equal(payout.finalAmount, 0);
  assert.equal(payout.payoutStatus, 'base_paid');
  assert.equal(isPayoutAwaitingAdjustments(payout), true);
});

test('applyStaffPayoutAdjustments finalizes with no adjustments', () => {
  const { periodStart, periodEnd } = getCompensationPeriodBounds('weekly', new Date('2026-08-06T12:00:00.000Z'));
  const base = buildInstantBasePayout({
    preview: {
      staffId: 'staff-1',
      staffName: 'Alex',
      staffEmail: 'alex@guardr.test',
      staffRole: 'Support',
      rolePercent: 0.045,
      peersInRole: 1,
      platformFeesInPeriod: 40,
      baseAmount: 1.8,
      floorAmount: 0,
      capAmount: 1100,
      cappedBaseAmount: 1.8,
      alreadyPaidAmount: 0,
      pendingAmount: 1.8,
      needsPeriodPayout: false,
      isActive: true,
      trackedHours: 5,
      hourlyPayRate: 18,
      awaitingAdjustments: false,
    },
    periodStart,
    periodEnd,
  });
  const finalized = applyStaffPayoutAdjustments(
    base,
    { choice: 'none', includeHourlyPay: false, trackedHours: 5, hourlyRate: 18, manualAdjustment: 0 },
    { id: 'dir-1', email: 'dir@guardr.test' },
  );
  assert.equal(finalized.payoutStatus, 'finalized');
  assert.equal(finalized.finalAmount, 1.8);
  assert.equal(finalized.adjustmentChoice, 'none');
});
