import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityGuard } from '../types';
import {
  getGuardActivationChecklist,
  guardCanStaffActivateAccount,
  guardCanStaffApproveProfile,
  isGuardAccountActive,
} from './guardAccountActivation';

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
    idFrontImageUrl: 'front',
    idBackImageUrl: 'back',
    idSelfieImageUrl: 'selfie',
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
        status: 'verified',
        imageUrl: 'pta',
        category: 'training',
      },
      {
        id: 'c3',
        catalogId: 'bsis-32-hour-completed',
        name: '32-hour block',
        issuer: 'BSIS',
        status: 'verified',
        imageUrl: '32hr',
        category: 'training',
      },
    ],
    ...overrides,
  });
}

describe('guard account activation gates', () => {
  it('blocks profile approval until ID, COI, and guard card are verified', () => {
    const guard = baseGuard({
      idVerificationStatus: 'verified',
      idState: 'CA',
      idNumber: 'ID123',
      idExpiryDate: '2099-12-31',
      idFrontImageUrl: 'front',
      idBackImageUrl: 'back',
      idSelfieImageUrl: 'selfie',
      insurancePolicy: {
        id: 'ins-1',
        guardId: 'g1',
        carrier: 'Carrier',
        policyNumber: 'POL-1',
        expiryDate: '2099-12-31',
        documentUrl: 'doc',
        status: 'verified',
      },
    });

    assert.equal(guardCanStaffApproveProfile(guard), false);
    const blockers = getGuardActivationChecklist(guard).staffApprovalBlockers;
    assert.ok(blockers.some((b) => b.includes('Guard Card')));
  });

  it('blocks activation until PTA/UOF and 32-hour block are verified', () => {
    const guard = baseGuard({
      userStatus: 'approved',
      idVerificationStatus: 'verified',
      idState: 'CA',
      idNumber: 'ID123',
      idExpiryDate: '2099-12-31',
      idFrontImageUrl: 'front',
      idBackImageUrl: 'back',
      idSelfieImageUrl: 'selfie',
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
          expiryDate: '2099-12-31',
          status: 'verified',
          imageUrl: 'card',
          category: 'guard-card',
        },
      ],
    });

    assert.equal(guardCanStaffActivateAccount(guard), false);
    const blockers = getGuardActivationChecklist(guard).staffActivationBlockers;
    assert.ok(blockers.some((b) => b.includes('PTA/UOF')));
    assert.ok(blockers.some((b) => b.includes('32-hour')));
  });

  it('treats active user_status without all five credentials as not active', () => {
    const guard = baseGuard({
      userStatus: 'active',
      idVerificationStatus: 'verified',
      idState: 'CA',
      idNumber: 'ID123',
      idExpiryDate: '2099-12-31',
      idFrontImageUrl: 'front',
      idBackImageUrl: 'back',
      idSelfieImageUrl: 'selfie',
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
          expiryDate: '2099-12-31',
          status: 'verified',
          imageUrl: 'card',
          category: 'guard-card',
        },
      ],
    });

    assert.equal(isGuardAccountActive(guard), false);
    assert.equal(getGuardActivationChecklist(guard).canActivate, false);
  });

  it('treats guards as active only when user_status is active and all five are verified', () => {
    const guard = fullyVerifiedGuard();
    assert.equal(isGuardAccountActive(guard), true);
    assert.equal(getGuardActivationChecklist(guard).canActivate, true);
    assert.equal(guardCanStaffActivateAccount(guard), false);
  });
});
