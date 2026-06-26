import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityGuard } from '../types';
import {
  getGuardActivationChecklist,
  guardCanStaffActivateAccount,
  guardCanStaffApproveProfile,
  isGuardAccountActive,
} from './guardAccountActivation.ts';

function baseGuard(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'g1',
    name: 'Test Guard',
    email: 'guard@test.com',
    userStatus: 'pending',
    verified: false,
    certifications: [],
    ...overrides,
  } as SecurityGuard;
}

function fullyVerifiedGuard(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return baseGuard({
    userStatus: 'active',
    verified: true,
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
    ...overrides,
  });
}

describe('guard account activation gates', () => {
  it('blocks profile approval until all five credentials are verified', () => {
    const guard = fullyVerifiedGuard({
      userStatus: 'pending',
      idVerificationStatus: 'pending',
      insurancePolicy: {
        id: 'ins-1',
        guardId: 'g1',
        carrier: 'Carrier',
        policyNumber: 'POL-1',
        expiryDate: '2099-12-31',
        documentUrl: 'doc',
        status: 'pending',
      },
      certifications: fullyVerifiedGuard().certifications.map((cert) =>
        cert.catalogId === 'bsis-pta-uof-8hr' ? { ...cert, status: 'pending' } : cert
      ),
    });

    assert.equal(guardCanStaffApproveProfile(guard), false);
    const blockers = getGuardActivationChecklist(guard).staffApprovalBlockers;
    assert.ok(blockers.some((b) => /government id/i.test(b)));
    assert.ok(blockers.some((b) => /insurance/i.test(b)));
    assert.ok(blockers.some((b) => /pta\/uof/i.test(b)));
  });

  it('allows profile approval when all five are Guardr-verified', () => {
    const guard = fullyVerifiedGuard({ userStatus: 'pending' });
    assert.equal(guardCanStaffApproveProfile(guard), true);
    assert.equal(getGuardActivationChecklist(guard).canStaffApprove, true);
  });

  it('blocks profile approval when guard card is on file but not verified', () => {
    const guard = fullyVerifiedGuard({
      userStatus: 'pending',
      certifications: fullyVerifiedGuard().certifications.map((cert) =>
        cert.catalogId === 'bsis-guard-card' ? { ...cert, status: 'pending' } : cert
      ),
    });
    assert.equal(guardCanStaffApproveProfile(guard), false);
    assert.ok(
      getGuardActivationChecklist(guard).staffApprovalBlockers.some((b) => b.includes('Guard Card'))
    );
  });

  it('blocks marketplace eligibility until all five credentials are verified', () => {
    const guard = fullyVerifiedGuard({
      userStatus: 'approved',
      certifications: fullyVerifiedGuard().certifications.filter(
        (cert) => cert.catalogId !== 'bsis-32-hour-completed'
      ),
    });

    assert.equal(guardCanStaffActivateAccount(guard), false);
    assert.ok(
      getGuardActivationChecklist(guard).staffActivationBlockers.some((b) => b.includes('32-hour'))
    );
  });

  it('treats active user_status without all five verified credentials as not active', () => {
    const guard = fullyVerifiedGuard({
      userStatus: 'active',
      certifications: fullyVerifiedGuard().certifications.filter(
        (cert) => cert.catalogId !== 'bsis-32-hour-completed'
      ),
    });

    assert.equal(isGuardAccountActive(guard), false);
    assert.equal(getGuardActivationChecklist(guard).canActivate, false);
  });

  it('treats guards as active when user_status is active and all five are verified', () => {
    const guard = fullyVerifiedGuard();
    assert.equal(isGuardAccountActive(guard), true);
    assert.equal(getGuardActivationChecklist(guard).canActivate, true);
    assert.equal(guardCanStaffActivateAccount({ ...guard, userStatus: 'approved' }), true);
  });
});
