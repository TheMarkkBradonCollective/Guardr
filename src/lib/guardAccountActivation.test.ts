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

function fullyOnFileGuard(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return baseGuard({
    userStatus: 'active',
    verified: false,
    idVerificationStatus: 'pending',
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
      status: 'pending',
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
        status: 'pending',
        imageUrl: 'card',
        category: 'guard-card',
      },
      {
        id: 'c2',
        catalogId: 'bsis-pta-uof-8hr',
        name: 'PTA/UOF',
        issuer: 'BSIS',
        status: 'pending',
        imageUrl: 'pta',
        category: 'training',
      },
      {
        id: 'c3',
        catalogId: 'bsis-32-hour-completed',
        name: '32-hour block',
        issuer: 'BSIS',
        status: 'pending',
        imageUrl: '32hr',
        category: 'training',
      },
    ],
    ...overrides,
  });
}

describe('guard account activation gates', () => {
  it('blocks profile approval until all five credentials are on file', () => {
    const guard = baseGuard({
      idVerificationStatus: 'pending',
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
        status: 'pending',
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
          status: 'pending',
          imageUrl: 'card',
          category: 'guard-card',
        },
      ],
    });

    assert.equal(guardCanStaffApproveProfile(guard), false);
    const blockers = getGuardActivationChecklist(guard).staffApprovalBlockers;
    assert.ok(blockers.some((b) => b.includes('PTA/UOF')));
    assert.ok(blockers.some((b) => b.includes('32-hour')));
  });

  it('allows profile approval when all five are on file without staff verification', () => {
    const guard = fullyOnFileGuard({ userStatus: 'pending' });
    assert.equal(guardCanStaffApproveProfile(guard), true);
    assert.equal(getGuardActivationChecklist(guard).canStaffApprove, true);
  });

  it('blocks marketplace eligibility until all five credentials are on file', () => {
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

  it('treats guards as active when user_status is active and all five are on file', () => {
    const guard = fullyOnFileGuard();
    assert.equal(isGuardAccountActive(guard), true);
    assert.equal(getGuardActivationChecklist(guard).canActivate, true);
    assert.equal(guardCanStaffActivateAccount({ ...guard, userStatus: 'approved' }), true);
  });
});
