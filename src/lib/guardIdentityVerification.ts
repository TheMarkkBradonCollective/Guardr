import { SecurityGuard } from '../types';
import { isGuardSubmittedIdentityVerification } from './approvalSubmissions';
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
  'Required before profile approval: tap your government ID card, then Edit to enter state, number, expiration date, and upload front, back, and a live identity selfie. Once submitted, details are locked until staff reviews them.';

export function isIdExpired(guard: Pick<SecurityGuard, 'idExpiryDate'>): boolean {
  if (!guard.idExpiryDate) return false;
  const expiry = new Date(guard.idExpiryDate);
  return !Number.isNaN(expiry.getTime()) && expiry < new Date();
}

export function formatIdExpiryLabel(expiryDate?: string): string | null {
  if (!expiryDate) return null;
  const d = new Date(expiryDate);
  if (Number.isNaN(d.getTime())) return expiryDate;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatIdSummaryLine(
  guard: Pick<SecurityGuard, 'idState' | 'idNumber' | 'idExpiryDate'>
): string {
  const parts: string[] = [];
  if (guard.idState?.trim()) parts.push(guard.idState.trim().toUpperCase());
  if (guard.idNumber?.trim()) parts.push(`#${guard.idNumber.trim()}`);
  const expiry = formatIdExpiryLabel(guard.idExpiryDate);
  if (expiry) {
    parts.push(isIdExpired(guard) ? `Expired ${expiry}` : `Expires ${expiry}`);
  }
  return parts.length ? parts.join(' · ') : 'ID on file';
}

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

export function guardHasGovernmentIdOnFile(
  guard: Pick<
    SecurityGuard,
    'idState' | 'idNumber' | 'idExpiryDate' | 'idFrontUrl' | 'idBackUrl' | 'idSelfieUrl'
  >
): boolean {
  return Boolean(
    guard.idState?.trim() ||
      guard.idNumber?.trim() ||
      guard.idExpiryDate?.trim() ||
      guard.idFrontUrl?.trim() ||
      guard.idBackUrl?.trim() ||
      guard.idSelfieUrl?.trim()
  );
}

export function getGovernmentIdUploadStatus(
  guard: Pick<
    SecurityGuard,
    | 'idState'
    | 'idNumber'
    | 'idExpiryDate'
    | 'idFrontUrl'
    | 'idBackUrl'
    | 'idSelfieUrl'
    | 'idVerificationStatus'
  >
): 'missing' | 'listed' | 'on-file' | 'expired' {
  if (!guardHasGovernmentIdOnFile(guard)) return 'missing';
  if (!guardIdVerificationSubmissionReady(guard)) return 'listed';
  if (isIdExpired(guard)) return 'expired';
  return 'on-file';
}

export function getGovernmentIdUploadStatusSummary(guard: SecurityGuard): string {
  const status = getGovernmentIdUploadStatus(guard);
  if (status === 'missing') return 'Not on file';
  if (status === 'listed') return 'Incomplete — finish upload';
  if (status === 'expired') return 'On file · expired';
  const verification = getGuardIdVerificationStatus(guard);
  if (verification === 'verified') return 'Verified — on file';
  if (verification === 'pending') return 'Submitted — pending staff review';
  if (verification === 'rejected') return 'Resubmit requested';
  return 'On file';
}

export function guardIdVerificationSubmissionReady(
  guard: Pick<SecurityGuard, 'idState' | 'idNumber' | 'idExpiryDate' | 'idFrontUrl' | 'idBackUrl' | 'idSelfieUrl'>
): boolean {
  return Boolean(
    guard.idState?.trim() &&
      guard.idNumber?.trim() &&
      guard.idExpiryDate?.trim() &&
      guard.idFrontUrl?.trim() &&
      guard.idBackUrl?.trim() &&
      guard.idSelfieUrl?.trim()
  );
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

/** Staff requested clearer ID photos — guard must re-upload before approval. */
export function guardIdVerificationResubmitPending(
  guard: Pick<SecurityGuard, 'idVerificationStatus'>
): boolean {
  return getGuardIdVerificationStatus(guard) === 'rejected';
}

export function staffCanApproveIdVerification(
  guard: Pick<
    SecurityGuard,
    | 'idVerificationStatus'
    | 'idState'
    | 'idNumber'
    | 'idExpiryDate'
    | 'idFrontUrl'
    | 'idBackUrl'
    | 'idSelfieUrl'
  >
): boolean {
  return getGuardIdVerificationStatus(guard) === 'pending' && guardIdVerificationSubmissionReady(guard);
}

/** Resubmit requests are only allowed while ID review is pending — not after approval. */
export function staffCanRequestIdResubmit(
  guard: Pick<
    SecurityGuard,
    | 'idVerificationStatus'
    | 'idState'
    | 'idNumber'
    | 'idExpiryDate'
    | 'idFrontUrl'
    | 'idBackUrl'
    | 'idSelfieUrl'
  >
): boolean {
  return staffCanApproveIdVerification(guard);
}

export function getPendingIdentityVerifications(guards: SecurityGuard[]): SecurityGuard[] {
  return guards.filter(
    (g) =>
      isGuardSubmittedIdentityVerification(g) &&
      getGuardIdVerificationStatus(g) === 'pending' &&
      guardIdVerificationSubmissionReady(g)
  );
}

/** Credential-style upload label for government ID (matches cert rows). */
export function getIdCredentialUploadLabel(guard: SecurityGuard): string | null {
  if (!guardIdVerificationPhotosComplete(guard)) return null;
  return isIdExpired(guard) ? 'On file · Expired' : 'On file';
}

export function getIdCredentialUploadBadgeClass(guard: SecurityGuard): string {
  return isIdExpired(guard)
    ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
    : 'text-brand-primary border-brand-primary/30 bg-brand-primary/10';
}

/** Credential-style verification label — Guardr verified / Unverified / Rejected. */
export function getIdCredentialVerificationLabel(guard: SecurityGuard): string {
  const status = getGuardIdVerificationStatus(guard);
  if (status === 'rejected') return 'Rejected';
  if (status === 'verified') return 'Guardr verified';
  return 'Unverified';
}

export function getIdCredentialVerificationBadgeClass(guard: SecurityGuard): string {
  const status = getGuardIdVerificationStatus(guard);
  if (status === 'rejected') return 'text-red-400 border-red-500/30 bg-red-500/10';
  if (status === 'verified') return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  return 'text-brand-text-muted border-brand-border bg-brand-border/20';
}
