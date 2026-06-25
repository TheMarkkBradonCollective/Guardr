import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityGuard, SecurityRequest } from '../types';
import {
  guardMeetsRateRequirement,
  shouldSkipStaffGuardReview,
} from './guardMarketplace.ts';

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
  it('allows verified insured active guards to self-select jobs', () => {
    assert.equal(
      shouldSkipStaffGuardReview(baseGuard, stripeJob, { verifiedSelfServeEnabled: true }),
      true
    );
  });

  it('still allows trusted guards regardless of insurance', () => {
    assert.equal(
      shouldSkipStaffGuardReview({ ...baseGuard, trusted: true, insurancePolicy: undefined }, stripeJob),
      true
    );
  });
});

describe('guardMeetsRateRequirement', () => {
  it('blocks jobs below the guard minimum rate', () => {
    assert.equal(guardMeetsRateRequirement({ hourlyRateRequirement: 30 }, 25), false);
    assert.equal(guardMeetsRateRequirement({ hourlyRateRequirement: 30 }, 30), true);
  });
});
