import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityGuard } from '../types';
import {
  getStaffActivationChecklist,
  staffNeedsCredentialCompletion,
  staffNeedsIdReactivation,
  staffReadyForAutoActivation,
} from './staffAccountActivation';
import { withAutoStaffActivation } from './staffAutoActivation';
import { isStaffAccountApproved, isStaffAccountPreActive } from './accountStatus';

function staffMember(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'staff-1',
    name: 'Alex Ops',
    email: 'alex@guardr.test',
    badgeNumber: 'STF-10001',
    avatar: '',
    phone: '555-0100',
    bio: 'Operations background',
    isArmed: false,
    backgroundChecked: true,
    verified: false,
    rating: 0,
    jobsCompleted: 0,
    certifications: [],
    experience: [],
    isStaff: true,
    staffRole: 'Support',
    userStatus: 'approved',
    idVerificationStatus: 'verified',
    idFrontUrl: 'front.jpg',
    idBackUrl: 'back.jpg',
    idSelfieUrl: 'selfie.jpg',
    stripeConnectAccountId: 'acct_123',
    ...overrides,
  } as SecurityGuard;
}

describe('staffAccountActivation', () => {
  it('marks onboarding steps from ID and Stripe state', () => {
    const checklist = getStaffActivationChecklist(staffMember(), { stripePayoutsEnabled: true });
    assert.equal(checklist.find((s) => s.id === 'government_id')?.complete, true);
    assert.equal(checklist.find((s) => s.id === 'stripe_payout')?.complete, true);
  });

  it('does not treat verified staff IDs as complete without photos', () => {
    const member = staffMember({
      idVerificationStatus: 'verified',
      idFrontUrl: undefined,
      idBackUrl: undefined,
      idSelfieUrl: undefined,
    });
    const checklist = getStaffActivationChecklist(member, { stripePayoutsEnabled: true });
    assert.equal(checklist.find((s) => s.id === 'government_id')?.complete, false);
    assert.equal(staffReadyForAutoActivation(member, { stripePayoutsEnabled: true }), false);
  });

  it('restricts active staff until government ID photos are verified', () => {
    const member = staffMember({
      userStatus: 'active',
      verified: true,
      idVerificationStatus: 'verified',
      idFrontUrl: undefined,
      idBackUrl: undefined,
      idSelfieUrl: undefined,
    });
    assert.equal(staffNeedsCredentialCompletion(member), true);
    assert.equal(staffNeedsIdReactivation(member), true);
  });

  it('auto-activates approved staff when ID photos and Stripe payouts are ready', () => {
    const member = staffMember();
    assert.equal(staffReadyForAutoActivation(member, { stripePayoutsEnabled: true }), true);
    const activated = withAutoStaffActivation(member, { stripePayoutsEnabled: true });
    assert.equal(activated.userStatus, 'active');
    assert.equal(activated.verified, true);
  });

  it('keeps approved staff pre-active until Stripe payouts finish', () => {
    const member = staffMember({ stripeConnectAccountId: 'acct_123' });
    assert.equal(staffReadyForAutoActivation(member, { stripePayoutsEnabled: false }), false);
    assert.equal(isStaffAccountPreActive(member), true);
    assert.equal(isStaffAccountApproved(member), true);
  });
});
