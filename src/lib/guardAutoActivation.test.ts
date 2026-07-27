import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityGuard } from '../types';
import {
  buildAutoGuardActivationPatch,
  guardAutoActivated,
  guardReadyForAutoActivation,
  withAutoGuardActivation,
} from './guardAutoActivation.ts';

function fullyVerifiedApprovedGuard(): SecurityGuard {
  return {
    id: 'g1',
    name: 'Test Guard',
    email: 'guard@test.com',
    userStatus: 'approved',
    verified: false,
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
      carrier: 'Carrier',
      policyNumber: 'POL-1',
      expiryDate: '2099-12-31',
      documentUrl: 'doc',
      status: 'verified',
    },
    certifications: [
      {
        id: 'c1',
        catalogId: 'bsis-guard-card',
        name: 'BSIS Guard Card',
        issuer: 'BSIS',
        number: 'GC-1',
        state: 'CA',
        issueDate: '2024-01-01',
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
}

describe('guard auto activation', () => {
  it('does not auto-activate pending guards even when credentials are verified', () => {
    const guard = fullyVerifiedApprovedGuard();
    guard.userStatus = 'pending';
    assert.equal(guardReadyForAutoActivation(guard), false);
    assert.equal(buildAutoGuardActivationPatch(guard), null);
  });

  it('does not auto-activate approved guards missing verified credentials', () => {
    const guard = fullyVerifiedApprovedGuard();
    guard.certifications = guard.certifications.filter(
      (cert) => cert.catalogId !== 'bsis-32-hour-completed'
    );
    assert.equal(guardReadyForAutoActivation(guard), false);
  });

  it('auto-activates approved guards once all five credentials are verified', () => {
    const guard = fullyVerifiedApprovedGuard();
    const activated = withAutoGuardActivation(guard);
    assert.equal(activated.userStatus, 'active');
    assert.equal(activated.verified, true);
    assert.equal(guardAutoActivated(guard, activated), true);
  });

  it('leaves already-active guards unchanged', () => {
    const guard = fullyVerifiedApprovedGuard();
    guard.userStatus = 'active';
    guard.verified = true;
    const next = withAutoGuardActivation(guard);
    assert.equal(next.userStatus, 'active');
    assert.equal(guardAutoActivated(guard, next), false);
  });
});
