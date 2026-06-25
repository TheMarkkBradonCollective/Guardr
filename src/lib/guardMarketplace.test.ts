import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityGuard, SecurityRequest } from '../types';
import {
  guardMeetsRateRequirement,
  shouldSkipStaffGuardReview,
} from './guardMarketplace.ts';
import { buildInsuranceApprovalBlockers } from './guardInsurance.ts';

const baseGuard = {
  trusted: false,
  verified: true,
  userStatus: 'active',
  insurancePolicy: {
    id: 'ins-1',
    guardId: 'g1',
    carrier: 'Test Carrier',
    policyNumber: 'POL-1',
    expiryDate: '2099-12-31',
    status: 'verified',
  },
} as SecurityGuard;

const stripeJob = {
  clientPaymentMethod: 'stripe',
  clientCashPaymentRequested: false,
} as SecurityRequest;

describe('shouldSkipStaffGuardReview', () => {
  it('skips staff review for verified insured active guards on card jobs', () => {
    assert.equal(
      shouldSkipStaffGuardReview(baseGuard, stripeJob, { verifiedSelfServeEnabled: true }),
      true
    );
  });

  it('requires staff review for cash jobs', () => {
    assert.equal(
      shouldSkipStaffGuardReview(baseGuard, {
        ...stripeJob,
        clientCashPaymentRequested: true,
      }),
      false
    );
  });
});

describe('buildInsuranceApprovalBlockers', () => {
  it('blocks approval when COI is missing', () => {
    const blockers = buildInsuranceApprovalBlockers({});
    assert.ok(blockers.some((b) => b.includes('Certificate of Insurance')));
  });
});

describe('guardMeetsRateRequirement', () => {
  it('blocks jobs below the guard minimum rate', () => {
    assert.equal(guardMeetsRateRequirement({ hourlyRateRequirement: 30 }, 25), false);
    assert.equal(guardMeetsRateRequirement({ hourlyRateRequirement: 30 }, 30), true);
  });
});
