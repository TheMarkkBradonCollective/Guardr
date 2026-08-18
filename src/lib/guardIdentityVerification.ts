import { SecurityGuard } from '../types';
import type { GovernmentIdDocumentType } from '../types';
import { licenseStatesMatch, resolveGuardCardLicenseState } from './californiaCities';
import { isGuardSubmittedIdentityVerification } from './approvalSubmissions';
import { getGuardUserStatus } from './accountStatus';
import { guardApplicationCredentialVerificationBlocker } from './guardApplicationIntake';

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

export function governmentIdDocumentTypeLabel(type?: GovernmentIdDocumentType): string {
  return type === 'drivers_license' ? "Driver's license" : 'Government ID';
}

export function governmentIdSlotLabels(
  type?: GovernmentIdDocumentType
): Record<'front' | 'back' | 'selfie', string> {
  if (type === 'drivers_license') {
    return {
      front: 'License — front',
      back: 'License — back',
      selfie: 'Identity selfie',
    };
  }
  return {
    front: ID_VERIFICATION_SLOT_LABELS.front,
    back: ID_VERIFICATION_SLOT_LABELS.back,
    selfie: ID_VERIFICATION_SLOT_LABELS.selfie,
  };
}

export function guardGovernmentIdIsDriversLicense(
  guard: Pick<SecurityGuard, 'idDocumentType'>
): boolean {
  return guard.idDocumentType === 'drivers_license';
}

export const ID_VERIFICATION_SELFIE_HINT =
  'Take a clear headshot with your front camera. Face the camera directly with good lighting. This is for identity verification — not your profile photo.';

export const ID_VERIFICATION_POLICY_HINT =
  'Required before profile approval: tap your government ID card, then Edit to enter state, number, expiration date, and upload front, back, and a live identity selfie. Once submitted, details are locked until staff reviews them.';

export function isIdExpired(guard: Pick<SecurityGuard, 'idExpiryDate'>): boolean {
  if (!guard.idExpiryDate) return false;
  const expiry = new Date(guard.idExpiryDate);
  return !Number.isNaN(expiry.getTime()) && expiry < new Date();
}

/** Government ID is state-issued — must match the job's license jurisdiction (not work city). */
export function guardIdMatchesWorkLicenseState(
  guard: Pick<SecurityGuard, 'idState'>,
  jobCityOrLicenseState?: string
): boolean {
  const required = resolveGuardCardLicenseState(jobCityOrLicenseState);
  return licenseStatesMatch(guard.idState, required);
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

/** Verified status only counts when front, back, and selfie are actually on file. */
export function governmentIdEffectivelyVerified(
  guard: Pick<SecurityGuard, 'idVerificationStatus' | 'idFrontUrl' | 'idBackUrl' | 'idSelfieUrl'>
): boolean {
  return getGuardIdVerificationStatus(guard) === 'verified' && guardIdVerificationPhotosComplete(guard);
}

/**
 * Bounce a stored "verified" flag that has no ID photos — used for staff seeds and
 * legacy rows that were marked verified without an upload.
 */
export function bounceUnverifiedGovernmentIdStatus(
  guard: Pick<SecurityGuard, 'idVerificationStatus' | 'idFrontUrl' | 'idBackUrl' | 'idSelfieUrl'>
): GuardIdVerificationStatus {
  const status = getGuardIdVerificationStatus(guard);
  if (status === 'verified' && !guardIdVerificationPhotosComplete(guard)) return 'not_submitted';
  return status;
}

/** True when staff still needs to choose Government ID vs driver’s license (and class). */
export function guardGovIdNeedsDocumentTypeSelection(
  guard: Pick<SecurityGuard, 'idDocumentType' | 'idLicenseClass'>
): boolean {
  if (!guard.idDocumentType) return true;
  if (guard.idDocumentType === 'drivers_license' && !guard.idLicenseClass?.trim()) return true;
  return false;
}

/**
 * Government ID belongs in the Credentials feed when verification has started,
 * or when photos are already on file but status never flipped out of not_submitted
 * (so staff can classify ID vs license and review).
 */
export function guardGovIdBelongsInCredentialFeed(
  guard: Pick<
    SecurityGuard,
    'idVerificationStatus' | 'idFrontUrl' | 'idBackUrl' | 'idSelfieUrl' | 'isStaff'
  >
): boolean {
  if (guard.isStaff) return true;
  const status = bounceUnverifiedGovernmentIdStatus(guard);
  if (status !== 'not_submitted') return true;
  return guardIdVerificationPhotosComplete(guard);
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

export function getGovernmentIdUploadStatusSummary(
  guard: SecurityGuard,
  options?: { staffMode?: boolean }
): string {
  const status = getGovernmentIdUploadStatus(guard);
  if (status === 'missing') return 'Not on file';
  if (status === 'listed') {
    return options?.staffMode ? 'Incomplete — finish upload' : 'Not on file';
  }
  if (status === 'expired') return 'On file';
  const verification = getGuardIdVerificationStatus(guard);
  if (verification === 'verified') return 'Verified — on file';
  if (verification === 'pending') return 'Submitted — pending staff review';
  if (verification === 'rejected') return 'Resubmit requested';
  return 'On file';
}

export function guardIdVerificationSubmissionReady(
  guard: Pick<
    SecurityGuard,
    | 'idState'
    | 'idNumber'
    | 'idExpiryDate'
    | 'idFrontUrl'
    | 'idBackUrl'
    | 'idSelfieUrl'
    | 'idDocumentType'
    | 'idLicenseClass'
  >
): boolean {
  const baseReady = Boolean(
    guard.idState?.trim() &&
      guard.idNumber?.trim() &&
      guard.idExpiryDate?.trim() &&
      guard.idFrontUrl?.trim() &&
      guard.idBackUrl?.trim() &&
      guard.idSelfieUrl?.trim()
  );
  if (!baseReady) return false;
  if (guard.idDocumentType === 'drivers_license') {
    return Boolean(guard.idLicenseClass?.trim());
  }
  return Boolean(guard.idDocumentType);
}

export function guardIdVerificationIsLocked(
  guard: Pick<SecurityGuard, 'idVerificationStatus'>
): boolean {
  const status = getGuardIdVerificationStatus(guard);
  return status === 'pending' || status === 'verified';
}

export function guardIdVerificationCanEdit(
  guard: Pick<
    SecurityGuard,
    'idVerificationStatus' | 'userStatus' | 'isStaff' | 'idUpdateRequestedAt'
  >
): boolean {
  if (!guard.isStaff && getGuardUserStatus(guard) === 'blocked') return false;
  const status = getGuardIdVerificationStatus(guard);
  if (status === 'verified' && guard.idUpdateRequestedAt) return true;
  return status === 'not_submitted' || status === 'rejected';
}

export const GOV_ID_SUBMITTED_LOCKED_MESSAGE =
  'Government ID is locked after submission. Staff must request an update before you can change it.';

/** Staff requested clearer ID photos — guard must re-upload before approval. */
export function guardIdVerificationResubmitPending(
  guard: Pick<SecurityGuard, 'idVerificationStatus'>
): boolean {
  return getGuardIdVerificationStatus(guard) === 'rejected';
}

export function staffApproveIdVerificationBlocker(
  guard: Pick<
    SecurityGuard,
    'name' | 'userStatus' | 'isStaff' | 'mustChangePassword' | 'idDocumentType' | 'idLicenseClass'
  >
): string | null {
  const applicationBlocker = guardApplicationCredentialVerificationBlocker(guard, 'Government ID');
  if (applicationBlocker) return applicationBlocker;
  if (!guard.idDocumentType) {
    return 'Select whether this is a government ID or driver\'s license before approval.';
  }
  if (guard.idDocumentType === 'drivers_license' && !guard.idLicenseClass?.trim()) {
    return "Enter the driver's license class before approval.";
  }
  return null;
}

export function staffCanApproveIdVerification(
  guard: Pick<
    SecurityGuard,
    | 'name'
    | 'userStatus'
    | 'isStaff'
    | 'mustChangePassword'
    | 'idVerificationStatus'
    | 'idState'
    | 'idNumber'
    | 'idExpiryDate'
    | 'idFrontUrl'
    | 'idBackUrl'
    | 'idSelfieUrl'
  >
): boolean {
  if (staffApproveIdVerificationBlocker(guard)) return false;
  return getGuardIdVerificationStatus(guard) === 'pending' && guardIdVerificationSubmissionReady(guard);
}

/** Resubmit requests are only allowed while ID review is pending — not after approval. */
export function staffCanRequestIdResubmit(
  guard: Pick<
    SecurityGuard,
    | 'name'
    | 'userStatus'
    | 'isStaff'
    | 'mustChangePassword'
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
  return 'On file';
}

export function getIdCredentialUploadBadgeClass(guard: SecurityGuard): string {
  return 'text-brand-primary border-brand-primary/30 bg-brand-primary/10';
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
