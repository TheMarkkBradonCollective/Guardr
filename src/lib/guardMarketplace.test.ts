import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityGuard, SecurityRequest } from '../types';
import {
  guardMeetsRateRequirement,
  shouldSkipStaffGuardReview,
} from './guardMarketplace.ts';
import { buildInsuranceApprovalBlockers, isUserSubmittedPendingInsurance } from './guardInsurance.ts';

const baseGuard = {
  id: 'g1',
  trusted: false,
  verified: true,
  userStatus: 'active',
  idVerificationStatus: 'verified',
  idState: 'CA',
  idNumber: 'ID123',
  idExpiryDate: '2099-12-31',
  idFrontUrl: 'front',
  idBackUrl: 'back',
  idSelfieUrl: 'selfie',
  insurancePolicy: {
    id: 'ins-1',
    guardId: 'g1',
    carrier: 'Test Carrier',
    policyNumber: 'POL-1',
    expiryDate: '2099-12-31',
    status: 'verified',
    documentUrl: 'doc',
  },
  certifications: [
    {
      id: 'c1',
      catalogId: 'bsis-guard-card',
      name: 'BSIS Guard Card',
      issuer: 'BSIS',
      number: 'GC-1',
      state: 'CA',
      expiryDate: '2099-12-31',
      status: 'verified',
      imageUrl: 'card',
      category: 'guard-card',
    },
    {
      id: 'c2',
      catalogId: 'bsis-pta-uof-8hr',
      name: 'PTA/UOF',
      issuer: 'BSIS',
      number: 'PTA-1',
      issueDate: '2024-01-01',
      status: 'verified',
      imageUrl: 'pta',
      category: 'bsis-training',
    },
    {
      id: 'c3',
      catalogId: 'bsis-32-hour-completed',
      name: '32-hour block',
      issuer: 'BSIS',
      number: '32-1',
      issueDate: '2024-01-01',
      status: 'verified',
      imageUrl: '32hr',
      category: 'bsis-training',
    },
  ],
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

describe('pending COI approvals', () => {
  it('includes guard-submitted pending COI in the review queue', () => {
    const guard = {
      ...baseGuard,
      userStatus: 'approved' as const,
      insurancePolicy: {
        ...baseGuard.insurancePolicy!,
        status: 'pending' as const,
      },
    };
    assert.equal(isUserSubmittedPendingInsurance(guard), true);
  });

  it('excludes verified COI from the review queue', () => {
    assert.equal(isUserSubmittedPendingInsurance(baseGuard), false);
  });
});

describe('guardMeetsRateRequirement', () => {
  it('blocks jobs below the guard minimum rate', () => {
    assert.equal(guardMeetsRateRequirement({ hourlyRateRequirement: 30 }, 25), false);
    assert.equal(guardMeetsRateRequirement({ hourlyRateRequirement: 30 }, 30), true);
  });
});
