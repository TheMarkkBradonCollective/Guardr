import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityGuard } from '../types';
import {
  getStaffActivationChecklist,
  getStaffRosterStatusLabel,
  staffHasApplicationIntake,
  staffNeedsCredentialCompletion,
  staffNeedsIdReactivation,
  staffCanUploadIdFromProfile,
  staffReadyForAutoActivation,
} from './staffAccountActivation';
import { bounceUnverifiedStaffUserStatus, mapStaffRowToSecurityGuard } from './staffAccounts';
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
    assert.equal(getStaffRosterStatusLabel(member), 'Inactive');
  });

  it('sends newly approved staff to activation, not reactivation', () => {
    const member = staffMember({
      userStatus: 'approved',
      verified: false,
      idVerificationStatus: 'pending',
      idFrontUrl: 'front.jpg',
      idBackUrl: 'back.jpg',
      idSelfieUrl: 'selfie.jpg',
    });
    assert.equal(staffNeedsIdReactivation(member), false);
    assert.equal(staffNeedsCredentialCompletion(member), true);
    assert.equal(getStaffRosterStatusLabel(member), 'Inactive');
  });

  it('keeps first-time pending staff on activation, not reactivation', () => {
    const member = staffMember({
      userStatus: 'pending',
      verified: false,
      idVerificationStatus: 'not_submitted',
      idFrontUrl: undefined,
      idBackUrl: undefined,
      idSelfieUrl: undefined,
    });
    assert.equal(staffNeedsIdReactivation(member), false);
    assert.equal(staffNeedsCredentialCompletion(member), true);
    assert.equal(getStaffRosterStatusLabel(member), 'Pending approval');
  });

  it('treats manually added staff application fields as complete intake', () => {
    const member = staffMember({
      userStatus: 'approved',
      phone: '555-0199',
      yearsExperience: 8,
      availabilityNotes: 'Weekdays',
      referredBy: 'Director',
      bio: 'Ops background from the field.',
      summary: 'Platform operations',
    });
    assert.equal(staffHasApplicationIntake(member), true);
  });

  it('exempts management from activation gate but bounces missing ID to approved', () => {
    const director = staffMember({
      staffRole: 'Director',
      userStatus: 'active',
      verified: true,
      idVerificationStatus: 'not_submitted',
      idFrontUrl: undefined,
      idBackUrl: undefined,
      idSelfieUrl: undefined,
    });
    assert.equal(staffNeedsCredentialCompletion(director), false);
    assert.equal(staffNeedsIdReactivation(director), false);
    assert.equal(
      bounceUnverifiedStaffUserStatus({
        user_status: 'active',
        staff_role: 'Director',
        id_verification_status: 'not_submitted',
        id_front_url: null,
        id_back_url: null,
        id_selfie_url: null,
      }),
      'approved',
    );
    const approvedDirector = staffMember({
      staffRole: 'Director',
      userStatus: 'approved',
      verified: false,
      idVerificationStatus: 'not_submitted',
    });
    assert.equal(staffCanUploadIdFromProfile(approvedDirector), true);
  });

  it('bounces active operations staff missing verified ID to approved', () => {
    assert.equal(
      bounceUnverifiedStaffUserStatus({
        user_status: 'active',
        staff_role: 'Support',
        id_verification_status: 'pending',
        id_front_url: 'front.jpg',
        id_back_url: 'back.jpg',
        id_selfie_url: 'selfie.jpg',
      }),
      'approved',
    );
    assert.equal(
      bounceUnverifiedStaffUserStatus({
        user_status: 'active',
        staff_role: 'Founder',
        id_verification_status: 'not_submitted',
        id_front_url: null,
        id_back_url: null,
        id_selfie_url: null,
      }),
      'active',
    );
    const mapped = mapStaffRowToSecurityGuard({
      id: 'staff-1',
      name: 'Alex Ops',
      email: 'alex@guardr.test',
      badge_number: 'STF-10001',
      staff_role: 'Support',
      user_status: 'active',
      id_verification_status: 'pending',
      phone: '555-0100',
      bio: 'Added in the database',
      years_experience: 4,
      availability_notes: 'Evenings',
    });
    assert.equal(mapped.userStatus, 'approved');
    assert.equal(staffNeedsIdReactivation(mapped), false);
    assert.equal(staffNeedsCredentialCompletion(mapped), true);
    assert.equal(getStaffRosterStatusLabel(mapped), 'Inactive');
    assert.equal(staffHasApplicationIntake(mapped), true);

    const approvedHire = mapStaffRowToSecurityGuard({
      id: 'staff-2',
      name: 'New Hire',
      email: 'hire@guardr.test',
      badge_number: 'SUP-00012',
      staff_role: 'Support',
      user_status: 'approved',
      id_verification_status: 'not_submitted',
      phone: '555-0101',
      bio: 'New staff application',
    });
    assert.equal(approvedHire.userStatus, 'approved');
    assert.equal(staffNeedsIdReactivation(approvedHire), false);
    assert.equal(staffNeedsCredentialCompletion(approvedHire), true);
    assert.equal(getStaffRosterStatusLabel(approvedHire), 'Inactive');
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
