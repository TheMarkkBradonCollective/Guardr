import { Certification, SecurityGuard } from '../types';
import { guardHasSubmittedItemsForStaffReview } from './approvalSubmissions';
import { certHasDocumentProof } from './certImagePolicy';
import { resolveCertCatalogId } from './certCatalog';
import { getGuardMissingGraceCredentialLabels, getGuardMissingWorkCredentialLabels } from './guardMissingCredentials';
import {
  guardHasExpiredIdOnFile,
  guardHasGuardrVerifiedCredential,
  guardHasCredentialListed,
  guardHasCredentialOnFile,
  guardHasIdOnFile,
  guardMeetsContinuingEducation,
  guardMeetsContinuingEducationVerified,
  guardMeetsMandatoryTraining,
  guardMeetsMandatoryTrainingVerified,
  guardMeetsLevel1,
  guardHasVerifiedIdForWork,
} from './guardQualification';
import {
  getGuardIdVerificationStatus,
  guardIdMatchesWorkLicenseState,
  guardIdVerificationPhotosComplete,
  guardIdVerificationSubmissionReady,
  isIdExpired,
} from './guardIdentityVerification';
import {
  buildInsuranceSubmissionBlockers,
  guardHasInsuranceSubmitted,
  guardHasValidInsurance,
} from './guardInsurance';
import {
  GUARD_CREDENTIAL_RESTRICTED_LABEL,
  isGuardCredentialExpiryRestricted,
  listExpiredCredentialsForEnforcement,
} from './guardCredentialExpiryEnforcement';
import { getGuardApplicationCredentialSteps } from './guardApplicationCredentialSteps';
import {
  getGuardUserStatus,
  isGuardAccountApproved,
  isGuardAccountPending,
  isGuardUserStatusActive,
  GUARD_USER_STATUS_LABELS,
} from './accountStatus';
import { getStaffRosterStatusLabel } from './staffAccountActivation';

export const MARKETPLACE_ELIGIBILITY_LABEL = 'Marketplace eligibility';

/**
 * Already-active accounts keep marketplace access for Continuing Education under the new
 * 32-hour CE package taxonomy. Mandatory training (PTA/UOF) is still required — separate or combined
 * 8-hour certificates are accepted.
 */
export function guardHasActiveTrainingGrandfather(guard: SecurityGuard): boolean {
  if (guard.isStaff) return true;
  return isGuardUserStatusActive(guard);
}

/** Active for marketplace work — user_status active and required credentials verified. */
export function isGuardAccountActive(guard: SecurityGuard, state = 'CA'): boolean {
  if (guard.isStaff) return true;
  if (!isGuardUserStatusActive(guard)) return false;
  if (!Array.isArray(guard.certifications)) return false;
  return guardMeetsAllActivationCredentialsOnFile(guard, state);
}

export function guardMeetsAllActivationCredentialsOnFile(guard: SecurityGuard, state = 'CA'): boolean {
  return buildCredentialActivationBlockers(guard, state).length === 0;
}

export interface GuardActivationChecklist {
  idSubmitted: boolean;
  idVerified: boolean;
  guardCardSubmitted: boolean;
  guardCardVerified: boolean;
  insuranceSubmitted: boolean;
  insuranceVerified: boolean;
  /** Guard-facing — all five activation credentials verified. */
  canActivate: boolean;
  /** Staff can approve the application (pending → approved). */
  canStaffApprove: boolean;
  /** Approved guard with all five credentials verified — account activates automatically. */
  canStaffActivate: boolean;
  /** Blockers for approving the guard application. */
  staffApprovalBlockers: string[];
  /** Blockers preventing automatic activation after approval. */
  staffActivationBlockers: string[];
  missingWorkCredentials: string[];
  missingGraceCredentials: string[];
  /** @deprecated Use staffApprovalBlockers */
  blockers: string[];
}

function isGuardCardCert(cert: Certification): boolean {
  if (cert.status === 'rejected') return false;
  const catalogId = resolveCertCatalogId(cert);
  return catalogId === 'bsis-guard-card' || /guard card|bsis guard/i.test(cert.name);
}

export function getGuardCardCertifications(guard: SecurityGuard): Certification[] {
  return (guard.certifications ?? []).filter(isGuardCardCert);
}

export function guardHasGuardCardSubmitted(guard: SecurityGuard): boolean {
  return getGuardCardCertifications(guard).some((cert) => certHasDocumentProof(cert));
}

export function guardHasVerifiedGuardCard(guard: SecurityGuard, state = 'CA'): boolean {
  return guardHasGuardrVerifiedCredential(guard, 'bsis-guard-card', state);
}

export function guardIdIsVerified(guard: SecurityGuard): boolean {
  return getGuardIdVerificationStatus(guard) === 'verified';
}

function buildIdSubmissionBlockers(guard: SecurityGuard): string[] {
  const idStatus = getGuardIdVerificationStatus(guard);
  const blockers: string[] = [];

  if (!guard.isStaff && getGuardUserStatus(guard) === 'blocked') {
    blockers.push('Guard application rejected — account blocked');
  } else if (idStatus === 'rejected') {
    blockers.push('ID resubmit requested — profile approval on hold until guard re-uploads');
  } else if (!guardIdVerificationSubmissionReady(guard) && idStatus !== 'verified') {
    blockers.push('Government ID not fully on file — state, number, expiration, and all photos required');
  } else if (guardHasExpiredIdOnFile(guard)) {
    blockers.push('Government ID has expired — guard must upload a valid ID');
  }

  return blockers;
}

function buildGuardCardSubmissionBlockers(guard: SecurityGuard, state = 'CA'): string[] {
  const jobState = state || 'CA';
  const blockers: string[] = [];

  if (!guardHasCredentialOnFile(guard, 'bsis-guard-card', jobState)) {
    if (guardHasCredentialListed(guard, 'bsis-guard-card', jobState)) {
      blockers.push('BSIS Guard Card listed — document photo required for profile approval');
    } else {
      blockers.push('BSIS Guard Card not on file — required for profile approval');
    }
  }

  return blockers;
}

function buildGuardCardVerificationBlockers(guard: SecurityGuard, state = 'CA'): string[] {
  const submissionBlockers = buildGuardCardSubmissionBlockers(guard, state);
  if (submissionBlockers.length > 0) return submissionBlockers;
  if (!guardHasVerifiedGuardCard(guard, state)) {
    return ['BSIS Guard Card awaiting staff verification'];
  }
  return [];
}

function buildMandatoryTrainingSubmissionBlockers(guard: SecurityGuard): string[] {
  if (!guardMeetsMandatoryTraining(guard)) {
    return [
      'Mandatory training (Power to Arrest & Appropriate Use of Force) not on file — required for profile approval',
    ];
  }
  return [];
}

function buildContinuingEducationSubmissionBlockers(guard: SecurityGuard): string[] {
  if (!guardMeetsContinuingEducation(guard)) {
    return [
      'Continued Education not complete — the full 32-hour BSIS CE package is required for profile approval',
    ];
  }
  return [];
}

function buildIdVerificationBlockers(guard: SecurityGuard): string[] {
  const submissionBlockers = buildIdSubmissionBlockers(guard);
  if (submissionBlockers.length > 0) return submissionBlockers;
  if (!guardHasVerifiedIdForWork(guard)) {
    return ['Government ID awaiting staff verification'];
  }
  return [];
}

function buildInsuranceVerificationBlockers(guard: SecurityGuard): string[] {
  const submissionBlockers = buildInsuranceSubmissionBlockers(guard);
  if (submissionBlockers.length > 0) return submissionBlockers;
  if (!guardHasValidInsurance(guard)) {
    return ['Certificate of Insurance awaiting staff verification'];
  }
  return [];
}

function buildMandatoryTrainingVerificationBlockers(guard: SecurityGuard): string[] {
  const submissionBlockers = buildMandatoryTrainingSubmissionBlockers(guard);
  if (submissionBlockers.length > 0) return submissionBlockers;
  if (!guardMeetsMandatoryTrainingVerified(guard)) {
    return ['Mandatory training awaiting staff verification'];
  }
  return [];
}

function buildContinuingEducationVerificationBlockers(guard: SecurityGuard): string[] {
  const submissionBlockers = buildContinuingEducationSubmissionBlockers(guard);
  if (submissionBlockers.length > 0) return submissionBlockers;
  if (!guardMeetsContinuingEducationVerified(guard)) {
    return ['Continued Education awaiting staff verification'];
  }
  return [];
}

function buildCredentialActivationBlockers(guard: SecurityGuard, state = 'CA'): string[] {
  const identityBlockers = [
    ...buildIdVerificationBlockers(guard),
    ...buildInsuranceVerificationBlockers(guard),
    ...buildGuardCardVerificationBlockers(guard, state),
    ...buildMandatoryTrainingVerificationBlockers(guard),
  ];
  // Already-active guards are grandfathered only for Continuing Education (32-hour CE package).
  if (guardHasActiveTrainingGrandfather(guard)) {
    return identityBlockers;
  }
  return [
    ...identityBlockers,
    ...buildContinuingEducationVerificationBlockers(guard),
  ];
}

/** Staff may approve the guard application (pending → approved) after intake review. */
function buildApplicationApprovalBlockers(guard: SecurityGuard): string[] {
  const blockers: string[] = [];
  if (!guard.isStaff && getGuardUserStatus(guard) === 'blocked') {
    blockers.push('Guard application rejected — account blocked');
  }
  if (!isGuardAccountPending(guard)) {
    blockers.push('Guard application is not pending staff approval');
  }
  return blockers;
}

function buildStaffActivationBlockers(guard: SecurityGuard, state = 'CA'): string[] {
  const blockers: string[] = [];
  if (!isGuardAccountApproved(guard) && !isGuardUserStatusActive(guard)) {
    blockers.push('Approve the guard application before the account can activate');
  }
  blockers.push(...buildCredentialActivationBlockers(guard, state));
  return blockers;
}

export function getGuardActivationChecklist(guard: SecurityGuard, state = 'CA'): GuardActivationChecklist {
  const idStatus = getGuardIdVerificationStatus(guard);
  const idSubmitted =
    guardIdVerificationSubmissionReady(guard) || idStatus === 'verified' || guardHasIdOnFile(guard);
  const idVerified = guardIdIsVerified(guard);
  const guardCardSubmitted = guardHasGuardCardSubmitted(guard);
  const guardCardVerified = guardHasVerifiedGuardCard(guard, state);
  const insuranceSubmitted = guardHasInsuranceSubmitted(guard);
  const insuranceVerified = guardHasValidInsurance(guard);
  const staffApprovalBlockers = buildApplicationApprovalBlockers(guard);
  const staffActivationBlockers = buildStaffActivationBlockers(guard, state);
  const missingGraceCredentials = getGuardMissingGraceCredentialLabels(guard, state);
  const missingWorkCredentials = getGuardMissingWorkCredentialLabels(guard, state);

  const canStaffApprove = staffApprovalBlockers.length === 0;
  const canStaffActivate = staffActivationBlockers.length === 0;
  const credsReadyForActivation = buildCredentialActivationBlockers(guard, state).length === 0;
  const canActivate =
    credsReadyForActivation && (isGuardAccountApproved(guard) || isGuardUserStatusActive(guard));

  return {
    idSubmitted,
    idVerified,
    guardCardSubmitted,
    guardCardVerified,
    insuranceSubmitted,
    insuranceVerified,
    canActivate,
    canStaffApprove,
    canStaffActivate,
    staffApprovalBlockers,
    staffActivationBlockers,
    missingWorkCredentials,
    missingGraceCredentials,
    blockers: staffApprovalBlockers,
  };
}

export function guardCanActivateAccount(guard: SecurityGuard, state = 'CA'): boolean {
  if (guard.isStaff) return false;
  return getGuardActivationChecklist(guard, state).canActivate;
}

/** Pending → approved: staff reviews the application; guards may upload credentials while pending. */
export function guardCanStaffApproveProfile(guard: SecurityGuard, state = 'CA'): boolean {
  void state;
  if (guard.isStaff) return false;
  if (!isGuardAccountPending(guard)) return false;
  return getGuardActivationChecklist(guard).canStaffApprove;
}

/** Approved → active: all five activation credentials on file. */
export function guardCanStaffActivateAccount(guard: SecurityGuard, state = 'CA'): boolean {
  if (guard.isStaff) return false;
  if (!isGuardAccountApproved(guard)) return false;
  return getGuardActivationChecklist(guard, state).canStaffActivate;
}

export function guardAccountApprovalBlockers(guard: SecurityGuard, state = 'CA'): string[] {
  void state;
  return buildApplicationApprovalBlockers(guard);
}

export function guardAccountActivationBlockers(guard: SecurityGuard, state = 'CA'): string[] {
  return getGuardActivationChecklist(guard, state).staffActivationBlockers;
}

/** Restore suspended/blocked guards to active or approved based on activation readiness. */
export function resolveGuardRestoreUserStatus(guard: SecurityGuard, state = 'CA'): 'active' | 'approved' {
  if (guard.isStaff) return 'active';
  // Suspended/blocked accounts already cleared application approval. Do not reuse
  // staffActivationBlockers — that list requires approved|active status and would
  // always force "approved" for suspended restores even when credentials are ready.
  if (buildCredentialActivationBlockers(guard, state).length === 0) return 'active';
  return 'approved';
}

export function getApprovedGuardsAwaitingActivation(guards: SecurityGuard[]): SecurityGuard[] {
  return guards.filter((g) => {
    if (g.isStaff || !isGuardAccountApproved(g)) return false;
    const checklist = getGuardActivationChecklist(g);
    return guardHasSubmittedItemsForStaffReview(g) || guardAccountActivationBlockers(g).length > 0;
  });
}

/** Pending sign-ups with credentials submitted for staff review, or ready to approve. */
export function getPendingGuardAccountReviews(guards: SecurityGuard[]): SecurityGuard[] {
  return guards.filter((g) => {
    if (g.isStaff || !isGuardAccountPending(g)) return false;
    const checklist = getGuardActivationChecklist(g);
    return guardHasSubmittedItemsForStaffReview(g) || checklist.canStaffApprove;
  });
}

export function guardBelongsInAccountApprovalsQueue(guard: SecurityGuard): boolean {
  if (guard.isStaff) return false;
  const checklist = getGuardActivationChecklist(guard);
  if (isGuardAccountPending(guard)) {
    return guardHasSubmittedItemsForStaffReview(guard) || checklist.canStaffApprove;
  }
  if (isGuardAccountApproved(guard)) {
    return guardHasSubmittedItemsForStaffReview(guard) || guardAccountActivationBlockers(guard).length > 0;
  }
  return false;
}

/** Staff guard roster — approved guards also show marketplace / restriction state. */
export const GUARD_PENDING_CREDENTIALS_LABEL = 'Pending credentials';
export const GUARD_PENDING_CREDENTIAL_VERIFICATION_LABEL = 'Pending credential verification';

export function guardHasPendingCredentialUploads(guard: SecurityGuard): boolean {
  if (guard.isStaff) return false;
  const status = getGuardUserStatus(guard);
  if (status !== 'approved' && status !== 'pending') return false;
  return getGuardApplicationCredentialSteps(guard).some((step) => step.status === 'pending');
}

export function guardHasPendingCredentialVerification(guard: SecurityGuard): boolean {
  if (guard.isStaff) return false;
  const status = getGuardUserStatus(guard);
  if (status !== 'approved' && status !== 'pending') return false;
  return getGuardApplicationCredentialSteps(guard).some((step) => step.status === 'submitted');
}

/** Aggregate roster badge labels for guards with incomplete activation credentials. */
export function getGuardPendingCredentialBadgeLabels(guard: SecurityGuard, state = 'CA'): string[] {
  if (guard.isStaff) return [];

  const labels: string[] = [];

  if (isGuardCredentialExpiryRestricted(guard)) {
    const expiredBlocking = listExpiredCredentialsForEnforcement(guard, state).filter(
      (item) => item.blocksWork
    );
    if (expiredBlocking.length > 0) {
      labels.push(GUARD_PENDING_CREDENTIALS_LABEL);
    }
    if (guardHasPendingCredentialVerification(guard)) {
      labels.push(GUARD_PENDING_CREDENTIAL_VERIFICATION_LABEL);
    }
    return labels;
  }

  if (guardHasPendingCredentialUploads(guard)) {
    labels.push(GUARD_PENDING_CREDENTIALS_LABEL);
  }
  if (guardHasPendingCredentialVerification(guard)) {
    labels.push(GUARD_PENDING_CREDENTIAL_VERIFICATION_LABEL);
  }
  return labels;
}

function pendingCredentialBadges(guard: SecurityGuard, state = 'CA'): GuardRosterAccountBadge[] {
  return getGuardPendingCredentialBadgeLabels(guard, state).map((label) => ({
    label,
    tone: 'warning' as const,
  }));
}

export type GuardRosterAccountBadge = {
  label: string;
  tone: 'default' | 'primary' | 'success' | 'warning' | 'danger';
};

export function getGuardRosterAccountBadges(guard: SecurityGuard): GuardRosterAccountBadge[] {
  if (guard.isStaff) {
    const status = getGuardUserStatus(guard);
    const label = getStaffRosterStatusLabel(guard);
    return [
      {
        label,
        tone:
          status === 'active' && label === 'Active'
            ? 'success'
            : status === 'suspended' || status === 'blocked'
              ? 'danger'
              : status === 'pending'
                ? 'warning'
                : 'default',
      },
    ];
  }

  const status = getGuardUserStatus(guard);

  if (status === 'pending') {
    const checklist = getGuardActivationChecklist(guard);
    const pendingCredentialPills = pendingCredentialBadges(guard);
    if (guardHasSubmittedItemsForStaffReview(guard) || checklist.canStaffApprove) {
      return [{ label: GUARD_USER_STATUS_LABELS.pending, tone: 'warning' }, ...pendingCredentialPills];
    }
    return [{ label: 'Application in progress', tone: 'default' }, ...pendingCredentialPills];
  }

  if (isGuardCredentialExpiryRestricted(guard)) {
    return [
      { label: GUARD_USER_STATUS_LABELS.approved, tone: 'primary' },
      { label: GUARD_CREDENTIAL_RESTRICTED_LABEL, tone: 'danger' },
      ...pendingCredentialBadges(guard),
    ];
  }

  if (status === 'active') {
    return [
      { label: GUARD_USER_STATUS_LABELS.approved, tone: 'primary' },
      { label: GUARD_USER_STATUS_LABELS.active, tone: 'success' },
    ];
  }

  if (status === 'approved') {
    return [
      { label: GUARD_USER_STATUS_LABELS.approved, tone: 'primary' },
      ...pendingCredentialBadges(guard),
    ];
  }

  return [
    {
      label: GUARD_USER_STATUS_LABELS[status],
      tone: status === 'suspended' || status === 'blocked' ? 'danger' : 'default',
    },
  ];
}

/** @deprecated Prefer getGuardRosterAccountBadges — primary label for legacy callers. */
export function getGuardRosterAccountLabel(guard: SecurityGuard): string {
  return getGuardRosterAccountBadges(guard)[0]?.label ?? GUARD_USER_STATUS_LABELS.pending;
}

export function getGuardRosterAccountBadgeTone(
  guard: SecurityGuard
): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
  return getGuardRosterAccountBadges(guard)[0]?.tone ?? 'default';
}

export function getPendingGuardsMissingActivationRequirements(guards: SecurityGuard[]): SecurityGuard[] {
  return guards.filter((g) => {
    if (g.isStaff || !isGuardAccountApproved(g)) return false;
    return buildCredentialActivationBlockers(g).length > 0;
  });
}

export function guardActivationSummaryLabel(guard: SecurityGuard): string {
  if (isGuardCredentialExpiryRestricted(guard)) {
    return 'Restricted — required credential expired';
  }
  const checklist = getGuardActivationChecklist(guard);
  if (isGuardAccountApproved(guard)) {
    if (!checklist.canStaffActivate) {
      return `Approved — ${checklist.staffActivationBlockers[0] ?? 'upload and verify credentials'}`;
    }
    return 'Approved — all credentials verified, account activating';
  }
  if (checklist.canStaffApprove) return 'Application ready for staff approval';
  const parts: string[] = [];
  if (getGuardUserStatus(guard) === 'blocked') parts.push('Application blocked');
  else parts.push('Awaiting staff application review');
  return parts.join(' · ') || 'Awaiting requirements';
}

/**
 * Returns the active guard patch when an approved guard has all five credentials verified.
 * @deprecated Use buildAutoGuardActivationPatch from guardAutoActivation.ts
 */
export function buildMarketplaceEligibilityActivation(
  guard: SecurityGuard,
  state = 'CA'
): SecurityGuard | null {
  if (guard.isStaff) return null;
  if (!isGuardAccountApproved(guard)) return null;
  if (guardAccountActivationBlockers(guard, state).length > 0) return null;
  return {
    ...guard,
    userStatus: 'active',
    verified: true,
    credentialGraceDeadline: undefined,
    credentialGraceMissing: undefined,
    credentialGraceHours: undefined,
  };
}
