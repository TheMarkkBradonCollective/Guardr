import { SecurityGuard } from '../types';
import { getGuardUserStatus } from './accountStatus';

export type GuardIdVerificationStatus = 'not_submitted' | 'pending' | 'verified' | 'rejected';

export const ID_VERIFICATION_STATUS_LABELS: Record<GuardIdVerificationStatus, string> = {
  not_submitted: 'Not submitted',
  pending: 'Pending review',
  verified: 'ID verified',
  rejected: 'Rejected',
};

export const ID_VERIFICATION_SLOT_LABELS = {
  front: 'ID — front',
  back: 'ID — back',
  selfie: 'Identity selfie',
} as const;

export const ID_VERIFICATION_SELFIE_HINT =
  'Take a clear headshot with your front camera. Face the camera directly with good lighting. This is for identity verification — not your profile photo.';

export const ID_VERIFICATION_POLICY_HINT =
  'Required for account activation: upload a government-issued photo ID (front and back) plus a live identity selfie. Once submitted, photos are locked until staff reviews them.';

export function getGuardIdVerificationStatus(
  guard: Pick<SecurityGuard, 'idVerificationStatus'>
): GuardIdVerificationStatus {
  return guard.idVerificationStatus ?? 'not_submitted';
}

export function guardIdVerificationPhotosComplete(
  guard: Pick<SecurityGuard, 'idFrontUrl' | 'idBackUrl' | 'idSelfieUrl'>
): boolean {
  return Boolean(guard.idFrontUrl?.trim() && guard.idBackUrl?.trim() && guard.idSelfieUrl?.trim());
}

export function guardIdVerificationIsLocked(
  guard: Pick<SecurityGuard, 'idVerificationStatus'>
): boolean {
  const status = getGuardIdVerificationStatus(guard);
  return status === 'pending' || status === 'verified';
}

export function guardIdVerificationCanEdit(
  guard: Pick<SecurityGuard, 'idVerificationStatus' | 'userStatus' | 'isStaff'>
): boolean {
  if (!guard.isStaff && getGuardUserStatus(guard) === 'blocked') return false;
  const status = getGuardIdVerificationStatus(guard);
  return status === 'not_submitted' || status === 'rejected';
}

export function getPendingIdentityVerifications(guards: SecurityGuard[]): SecurityGuard[] {
  return guards.filter(
    (g) => !g.isStaff && getGuardIdVerificationStatus(g) === 'pending' && guardIdVerificationPhotosComplete(g)
  );
}
