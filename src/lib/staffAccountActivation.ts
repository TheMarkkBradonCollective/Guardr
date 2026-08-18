import type { SecurityGuard } from '../types';
import {
  bounceUnverifiedGovernmentIdStatus,
  governmentIdEffectivelyVerified,
} from './guardIdentityVerification';
import {
  getGuardUserStatus,
  isStaffAccountApproved,
  isStaffAccountPending,
  isStaffAccountPreActive,
  isStaffUserStatusActive,
} from './accountStatus';

export type StaffActivationStepId = 'application' | 'government_id' | 'stripe_payout';

export interface StaffActivationStep {
  id: StaffActivationStepId;
  label: string;
  complete: boolean;
  detail?: string;
}

export function staffStripePayoutReady(
  member: Pick<SecurityGuard, 'stripeConnectAccountId'>,
  payoutsEnabled = false,
): boolean {
  if (!member.stripeConnectAccountId?.trim()) return false;
  return payoutsEnabled;
}

export function getStaffActivationChecklist(
  member: SecurityGuard,
  options?: { stripePayoutsEnabled?: boolean },
): StaffActivationStep[] {
  const idStatus = bounceUnverifiedGovernmentIdStatus(member);
  const idComplete = governmentIdEffectivelyVerified(member);
  const stripeReady = staffStripePayoutReady(member, options?.stripePayoutsEnabled === true);

  return [
    {
      id: 'application',
      label: 'Application submitted',
      complete: true,
      detail: isStaffAccountPending(member)
        ? 'Director review in progress'
        : isStaffAccountApproved(member)
          ? 'Application approved'
          : isStaffUserStatusActive(member)
            ? 'Approved'
            : undefined,
    },
    {
      id: 'government_id',
      label: 'Government ID verified',
      complete: idComplete,
      detail:
        idStatus === 'pending'
          ? 'Submitted — awaiting Director review'
          : idStatus === 'rejected'
            ? member.idVerificationRejectionReason || 'Rejected — resubmit'
            : idStatus === 'verified'
              ? 'Verified'
              : 'Upload ID front, back, and selfie',
    },
    {
      id: 'stripe_payout',
      label: 'Payout bank connected',
      complete: stripeReady,
      detail: stripeReady
        ? 'Stripe payouts enabled'
        : member.stripeConnectAccountId
          ? 'Finish Stripe bank setup'
          : 'Connect your bank through Stripe',
    },
  ];
}

export function staffActivationBlockers(
  member: SecurityGuard,
  options?: { stripePayoutsEnabled?: boolean },
): string[] {
  if (!member.isStaff || !isStaffAccountPreActive(member)) return [];
  const blockers: string[] = [];
  const checklist = getStaffActivationChecklist(member, options);
  for (const step of checklist) {
    if (step.id === 'application') continue;
    if (!step.complete) {
      blockers.push(step.label);
    }
  }
  if (!isStaffAccountApproved(member) && !isStaffAccountPending(member)) {
    blockers.unshift('Application must be approved');
  }
  return blockers;
}

export function staffReadyForAutoActivation(
  member: SecurityGuard,
  options?: { stripePayoutsEnabled?: boolean },
): boolean {
  if (!member.isStaff || !isStaffAccountApproved(member)) return false;
  if (!governmentIdEffectivelyVerified(member)) return false;
  return staffActivationBlockers(member, options).length === 0;
}

/** Active staff missing a real government ID, or pre-active staff still onboarding. */
export function staffNeedsCredentialCompletion(member: SecurityGuard): boolean {
  if (!member.isStaff) return false;
  const status = getGuardUserStatus(member);
  if (status === 'suspended' || status === 'blocked') return false;
  if (!governmentIdEffectivelyVerified(member)) return true;
  return isStaffAccountPreActive(member);
}

/**
 * Existing active staff who must re-complete ID verification.
 * New pending or approved hires stay on Staff activation, not reactivation.
 */
export function staffNeedsIdReactivation(member: SecurityGuard): boolean {
  return Boolean(
    member.isStaff && isStaffUserStatusActive(member) && !governmentIdEffectivelyVerified(member)
  );
}

export function getStaffRosterStatusLabel(member: SecurityGuard): string {
  const status = getGuardUserStatus(member);
  if (status === 'pending') return 'Pending approval';
  if (status === 'suspended') return 'Suspended';
  if (status === 'blocked') return 'Blocked';
  if (status === 'active' && governmentIdEffectivelyVerified(member)) return 'Active';
  return 'Inactive';
}

export function staffHasApplicationIntake(member: SecurityGuard): boolean {
  return Boolean(
    member.phone?.trim() ||
      member.firstName?.trim() ||
      member.lastName?.trim() ||
      member.bio?.trim() ||
      member.summary?.trim() ||
      member.about?.trim() ||
      member.yearsExperience != null ||
      member.availabilityNotes?.trim() ||
      member.referredBy?.trim() ||
      (member.specialties?.length ?? 0) > 0 ||
      (member.managedCities?.length ?? 0) > 0
  );
}

export function staffActivationProgress(member: SecurityGuard): {
  completed: number;
  total: number;
  percent: number;
  requirementLabel: string;
} {
  const steps = getStaffActivationChecklist(member).filter((s) => s.id !== 'application');
  const completed = steps.filter((s) => s.complete).length;
  const total = steps.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return {
    completed,
    total,
    percent,
    requirementLabel: `${completed} of ${total} onboarding steps complete`,
  };
}
