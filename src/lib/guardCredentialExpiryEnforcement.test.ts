import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Certification, GuardInsurancePolicy, SecurityGuard } from '../types';
import {
  applyGuardCredentialExpiryEnforcement,
  guardExpiredRequiredWorkCredentialUnresolved,
  listExpiredCredentialsForEnforcement,
} from './guardCredentialExpiryEnforcement';

function baseGuard(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'g1',
    name: 'Test Guard',
    email: 'guard@test.com',
    badgeNumber: '1',
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
    userStatus: 'active',
    idVerificationStatus: 'verified',
    idState: 'CA',
    idNumber: 'A123',
    idExpiryDate: '2099-12-31',
    idFrontUrl: 'front',
    idBackUrl: 'back',
    idSelfieUrl: 'selfie',
    insurancePolicy: {
      id: 'ins-1',
      guardId: 'g1',
      carrier: 'Carrier',
      policyNumber: 'P1',
      expiryDate: '2099-12-31',
      documentUrl: 'coi.pdf',
      status: 'verified',
    },
    ...overrides,
  };
}

describe('guardCredentialExpiryEnforcement', () => {
  it('lists expired government ID and COI as required work blockers', () => {
    const guard = baseGuard({
      idExpiryDate: '2020-01-01',
      insurancePolicy: {
        id: 'ins-1',
        guardId: 'g1',
        carrier: 'Carrier',
        policyNumber: 'P1',
        expiryDate: '2020-01-01',
        documentUrl: 'coi.pdf',
        status: 'verified',
      },
    });
    const items = listExpiredCredentialsForEnforcement(guard);
    assert.equal(items.length, 2);
    assert.deepEqual(
      items.map((item) => item.kind),
      ['government_id', 'coi']
    );
    assert.ok(items.every((item) => item.blocksWork));
  });

  it('auto-requests updates and restricts active accounts for expired required credentials', () => {
    const guard = baseGuard({
      idExpiryDate: '2020-01-01',
      insurancePolicy: {
        id: 'ins-1',
        guardId: 'g1',
        carrier: 'Carrier',
        policyNumber: 'P1',
        expiryDate: '2020-01-01',
        documentUrl: 'coi.pdf',
        status: 'verified',
      },
    });

    const result = applyGuardCredentialExpiryEnforcement(guard);
    assert.equal(result.changed, true);
    assert.ok(result.guard.idUpdateRequestedAt);
    assert.ok(result.guard.idUpdateRequestNote?.includes('Government ID expired'));
    assert.equal(result.guard.insurancePolicy?.status, 'expired');
    assert.ok(result.guard.insurancePolicy?.updateRequestedAt);
    assert.equal(result.guard.userStatus, 'approved');
    assert.equal(result.guard.credentialExpiryRestricted, true);
    assert.ok(result.notifications.length >= 2);
    assert.equal(guardExpiredRequiredWorkCredentialUnresolved(result.guard), true);
  });

  it('auto-requests update for expired verified permits without restricting account', () => {
    const permit: Certification = {
      id: 'permit-1',
      catalogId: 'bsis-exposed-firearm',
      name: 'BSIS Exposed Firearm Permit',
      issuer: 'BSIS',
      number: 'FP-1',
      issueDate: '2024-01-01',
      expiryDate: '2020-01-01',
      status: 'verified',
      imageUrl: 'scan',
      category: 'bsis-permit',
    };
    const guard = baseGuard({ certifications: [permit] });
    const result = applyGuardCredentialExpiryEnforcement(guard);

    assert.equal(result.changed, true);
    assert.equal(result.certUpdates.length, 1);
    assert.ok(result.certUpdates[0].cert.updateRequestedAt);
    assert.equal(result.guard.userStatus, 'active');
    assert.equal(result.guard.credentialExpiryRestricted, undefined);
  });

  it('restores active marketplace access after expired credentials are re-verified', () => {
    const guard = baseGuard({
      userStatus: 'approved',
      credentialExpiryRestricted: true,
      idUpdateRequestedAt: '2026-01-01T00:00:00.000Z',
      idUpdateRequestNote: 'Expired',
      idExpiryDate: '2099-12-31',
      insurancePolicy: {
        id: 'ins-1',
        guardId: 'g1',
        carrier: 'Carrier',
        policyNumber: 'P1',
        expiryDate: '2099-12-31',
        documentUrl: 'coi.pdf',
        status: 'verified',
        updateRequestedAt: '2026-01-01T00:00:00.000Z',
      } as GuardInsurancePolicy,
    });

    const result = applyGuardCredentialExpiryEnforcement(guard);
    assert.equal(result.changed, true);
    assert.equal(result.guard.userStatus, 'active');
    assert.equal(result.guard.credentialExpiryRestricted, false);
    assert.equal(guardExpiredRequiredWorkCredentialUnresolved(result.guard), false);
  });

  it('does not repeat update requests once already sent', () => {
    const guard = baseGuard({
      idExpiryDate: '2020-01-01',
      idUpdateRequestedAt: '2026-01-01T00:00:00.000Z',
      idUpdateRequestNote: 'Already requested',
      insurancePolicy: {
        id: 'ins-1',
        guardId: 'g1',
        carrier: 'Carrier',
        policyNumber: 'P1',
        expiryDate: '2020-01-01',
        documentUrl: 'coi.pdf',
        status: 'expired',
        updateRequestedAt: '2026-01-01T00:00:00.000Z',
      },
    });

    const result = applyGuardCredentialExpiryEnforcement(guard);
    assert.equal(result.changed, true);
    assert.equal(result.guard.idUpdateRequestedAt, '2026-01-01T00:00:00.000Z');
    assert.equal(result.certUpdates.length, 0);
  });
});
