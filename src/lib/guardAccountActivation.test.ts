import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityGuard } from '../types';
import {
  getGuardActivationChecklist,
  guardCanStaffActivateAccount,
  guardCanStaffApproveProfile,
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
});
