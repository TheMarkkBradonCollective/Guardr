import { Certification, SecurityGuard } from '../types';
import { isSelfSubmittedGuardAccount, guardHasSubmittedItemsForStaffReview } from './approvalSubmissions';
import { certHasDocumentProof } from './certImagePolicy';
import { resolveCertCatalogId } from './certCatalog';
import { getGuardMissingGraceCredentialLabels, getGuardMissingWorkCredentialLabels } from './guardMissingCredentials';
import {
  guardHasExpiredIdOnFile,
  guardHasGuardrVerifiedCredential,
  guardHasCredentialListed,
  guardHasCredentialOnFile,
  guardHasIdOnFile,
  guardMeets32HourBlock,
  guardMeets32HourBlockVerified,
  guardMeetsLevel1,
  guardMeetsPtaUofTraining,
  guardMeetsPtaUofTrainingVerified,
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
  getGuardUserStatus,
  isGuardAccountApproved,
  isGuardAccountPending,
  isGuardUserStatusActive,
  GUARD_USER_STATUS_LABELS,
} from './accountStatus';

export const MARKETPLACE_ELIGIBILITY_LABEL = 'Marketplace eligibility';

/** Active for marketplace work — user_status active and all five credentials verified. */
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
  /** Staff can grant marketplace eligibility when approved and all five credentials are verified. */
  canStaffActivate: boolean;
  /** Blockers for approving the guard application. */
  staffApprovalBlockers: string[];
  /** Blockers for granting marketplace eligibility (manual activation). */
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

function buildPtaUofSubmissionBlockers(guard: SecurityGuard): string[] {
  if (!guardMeetsPtaUofTraining(guard)) {
    return ['Power to Arrest & Appropriate Use of Force (PTA/UOF) not on file — required for profile approval'];
  }
  return [];
}

function build32HourSubmissionBlockers(guard: SecurityGuard): string[] {
  if (!guardMeets32HourBlock(guard)) {
    return ['32-hour BSIS course block not complete — required for profile approval'];
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

function buildPtaUofVerificationBlockers(guard: SecurityGuard): string[] {
  const submissionBlockers = buildPtaUofSubmissionBlockers(guard);
  if (submissionBlockers.length > 0) return submissionBlockers;
  if (!guardMeetsPtaUofTrainingVerified(guard)) {
    return ['PTA/UOF training awaiting staff verification'];
  }
  return [];
}

function build32HourVerificationBlockers(guard: SecurityGuard): string[] {
  const submissionBlockers = build32HourSubmissionBlockers(guard);
  if (submissionBlockers.length > 0) return submissionBlockers;
  if (!guardMeets32HourBlockVerified(guard)) {
    return ['32-hour BSIS block awaiting staff verification'];
  }
  return [];
}

function buildCredentialActivationBlockers(guard: SecurityGuard, state = 'CA'): string[] {
  return [
    ...buildIdVerificationBlockers(guard),
    ...buildInsuranceVerificationBlockers(guard),
    ...buildGuardCardVerificationBlockers(guard, state),
    ...buildPtaUofVerificationBlockers(guard),
    ...build32HourVerificationBlockers(guard),
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
    blockers.push('Approve the guard application before granting marketplace eligibility');
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

/** Pending → approved: staff reviews the application; credentials upload unlocks after approval. */
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

export function getApprovedGuardsAwaitingActivation(guards: SecurityGuard[]): SecurityGuard[] {
  return guards.filter((g) => {
    if (g.isStaff || !isGuardAccountApproved(g) || !isSelfSubmittedGuardAccount(g)) return false;
    const checklist = getGuardActivationChecklist(g);
    return guardHasSubmittedItemsForStaffReview(g) || checklist.canStaffActivate;
  });
}

/** Pending sign-ups with credentials submitted for staff review, or ready to approve. */
export function getPendingGuardAccountReviews(guards: SecurityGuard[]): SecurityGuard[] {
  return guards.filter((g) => {
    if (g.isStaff || !isGuardAccountPending(g) || !isSelfSubmittedGuardAccount(g)) return false;
    const checklist = getGuardActivationChecklist(g);
    return guardHasSubmittedItemsForStaffReview(g) || checklist.canStaffApprove;
  });
}

export function guardBelongsInAccountApprovalsQueue(guard: SecurityGuard): boolean {
  if (guard.isStaff || !isSelfSubmittedGuardAccount(guard)) return false;
  const checklist = getGuardActivationChecklist(guard);
  if (isGuardAccountPending(guard)) {
    return guardHasSubmittedItemsForStaffReview(guard) || checklist.canStaffApprove;
  }
  if (isGuardAccountApproved(guard)) {
    return guardHasSubmittedItemsForStaffReview(guard) || checklist.canStaffActivate;
  }
  return false;
}

/** Staff guard roster — only show "Pending approval" after the guard submits for review. */
export function getGuardRosterAccountLabel(guard: SecurityGuard): string {
  const status = getGuardUserStatus(guard);
  if (status === 'active' || status === 'suspended' || status === 'blocked') {
    return GUARD_USER_STATUS_LABELS[status];
  }
  if (isGuardAccountApproved(guard)) return GUARD_USER_STATUS_LABELS.approved;
  if (status === 'pending') {
    const checklist = getGuardActivationChecklist(guard);
    if (guardHasSubmittedItemsForStaffReview(guard) || checklist.canStaffApprove) {
      return GUARD_USER_STATUS_LABELS.pending;
    }
    return 'Application in progress';
  }
  return GUARD_USER_STATUS_LABELS[status];
}

export function getGuardRosterAccountBadgeTone(
  guard: SecurityGuard
): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
  const status = getGuardUserStatus(guard);
  if (status === 'active') return 'success';
  if (status === 'suspended' || status === 'blocked') return 'danger';
  if (isGuardAccountApproved(guard)) return 'primary';
  if (status === 'pending') {
    const checklist = getGuardActivationChecklist(guard);
    if (guardHasSubmittedItemsForStaffReview(guard) || checklist.canStaffApprove) return 'warning';
    return 'default';
  }
  return 'default';
}

export function getPendingGuardsMissingActivationRequirements(guards: SecurityGuard[]): SecurityGuard[] {
  return guards.filter((g) => {
    if (g.isStaff || !isGuardAccountApproved(g) || !isSelfSubmittedGuardAccount(g)) return false;
    return buildCredentialActivationBlockers(g).length > 0;
  });
}

export function guardActivationSummaryLabel(guard: SecurityGuard): string {
  const checklist = getGuardActivationChecklist(guard);
  if (isGuardAccountApproved(guard)) {
    if (!checklist.canStaffActivate) {
      return `Approved — ${checklist.staffActivationBlockers[0] ?? 'upload and verify credentials'}`;
    }
    return 'Approved — ready for staff to grant marketplace eligibility';
  }
  if (checklist.canStaffApprove) return 'Application ready for staff approval';
  const parts: string[] = [];
  if (getGuardUserStatus(guard) === 'blocked') parts.push('Application blocked');
  else parts.push('Awaiting staff application review');
  return parts.join(' · ') || 'Awaiting requirements';
}

/**
 * Manual activation only — never auto-promote from credential uploads.
 * Returns the active guard patch when staff explicitly grants marketplace eligibility.
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
