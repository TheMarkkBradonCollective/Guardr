import { Certification, SecurityGuard } from '../types';
import { isSelfSubmittedGuardAccount } from './approvalSubmissions';
import { certHasDocumentProof } from './certImagePolicy';
import { resolveCertCatalogId } from './certCatalog';
import { getGuardMissingGraceCredentialLabels, getGuardMissingWorkCredentialLabels } from './guardMissingCredentials';
import {
  guardHasExpiredGuardCard,
  guardHasExpiredIdOnFile,
  guardHasGuardrVerifiedCredential,
  guardHasCredentialListed,
  guardHasCredentialOnFile,
  guardHasIdOnFile,
  guardHasVerifiedIdForWork,
  guardMeetsLevel1,
  guardMeetsWorkRequirements,
} from './guardQualification';
import {
  getGuardIdVerificationStatus,
  guardIdVerificationSubmissionReady,
} from './guardIdentityVerification';
import { getGuardUserStatus, isGuardAccountApproved, isGuardAccountPending } from './accountStatus';
import {
  buildInsuranceApprovalBlockers,
  guardHasInsuranceSubmitted,
  guardHasValidInsurance,
} from './guardInsurance';
import { guardCredentialGracePatchForActivation } from './guardCredentialGrace';

export const MARKETPLACE_ELIGIBILITY_LABEL = 'Marketplace eligibility';

export interface GuardActivationChecklist {
  idSubmitted: boolean;
  idVerified: boolean;
  guardCardSubmitted: boolean;
  guardCardVerified: boolean;
  insuranceSubmitted: boolean;
  insuranceVerified: boolean;
  /** Guard-facing — all work requirements met (ID, guard card, PTA/UOF). */
  canActivate: boolean;
  /** Staff can approve profile (verified ID + verified COI). */
  canStaffApprove: boolean;
  /** Staff can activate account (verified ID + valid guard card). */
  canStaffActivate: boolean;
  /** Hard blockers preventing profile approval (ID + COI). */
  staffApprovalBlockers: string[];
  /** Hard blockers preventing account activation (ID + guard card). */
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
  return guard.certifications.filter(isGuardCardCert);
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

function buildIdBlockers(guard: SecurityGuard): string[] {
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
  } else if (!guardHasVerifiedIdForWork(guard)) {
    blockers.push('Government ID awaiting staff verification');
  }

  return blockers;
}

function buildGuardCardBlockers(guard: SecurityGuard, state = 'CA'): string[] {
  const jobState = state || 'CA';
  const blockers: string[] = [];

  if (guardHasExpiredGuardCard(guard, jobState)) {
    blockers.push('BSIS Guard Card has expired — guard must upload a valid card');
  } else if (!guardHasCredentialOnFile(guard, 'bsis-guard-card', jobState)) {
    if (guardHasCredentialListed(guard, 'bsis-guard-card', jobState)) {
      blockers.push('BSIS Guard Card listed — document photo required to activate');
    } else {
      blockers.push('BSIS Guard Card not on file — required to activate');
    }
  } else if (!guardHasVerifiedGuardCard(guard, jobState)) {
    blockers.push('BSIS Guard Card awaiting staff verification');
  }

  return blockers;
}

function buildStaffApprovalBlockers(guard: SecurityGuard): string[] {
  return [...buildIdBlockers(guard), ...buildInsuranceApprovalBlockers(guard)];
}

function buildStaffActivationBlockers(guard: SecurityGuard, state = 'CA'): string[] {
  return [...buildIdBlockers(guard), ...buildGuardCardBlockers(guard, state)];
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
  const staffApprovalBlockers = buildStaffApprovalBlockers(guard);
  const staffActivationBlockers = buildStaffActivationBlockers(guard, state);
  const missingGraceCredentials = getGuardMissingGraceCredentialLabels(guard, state);
  const missingWorkCredentials = getGuardMissingWorkCredentialLabels(guard, state);

  const canStaffApprove = staffApprovalBlockers.length === 0;
  const canStaffActivate = staffActivationBlockers.length === 0;
  const canActivate = guardMeetsWorkRequirements(guard, state);

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

/** Pending → approved: verified government ID and verified COI. */
export function guardCanStaffApproveProfile(guard: SecurityGuard, state = 'CA'): boolean {
  if (guard.isStaff) return false;
  if (!isGuardAccountPending(guard)) return false;
  return getGuardActivationChecklist(guard, state).canStaffApprove;
}

/** Approved → active: verified ID + valid guard card. */
export function guardCanStaffActivateAccount(guard: SecurityGuard, state = 'CA'): boolean {
  if (guard.isStaff) return false;
  if (!isGuardAccountApproved(guard)) return false;
  return getGuardActivationChecklist(guard, state).canStaffActivate;
}

export function guardAccountApprovalBlockers(guard: SecurityGuard, state = 'CA'): string[] {
  return getGuardActivationChecklist(guard, state).staffApprovalBlockers;
}

export function guardAccountActivationBlockers(guard: SecurityGuard, state = 'CA'): string[] {
  return getGuardActivationChecklist(guard, state).staffActivationBlockers;
}

export function getApprovedGuardsAwaitingActivation(guards: SecurityGuard[]): SecurityGuard[] {
  return guards.filter((g) => {
    if (g.isStaff || !isGuardAccountApproved(g) || !isSelfSubmittedGuardAccount(g)) return false;
    return true;
  });
}

/** Pending sign-ups with ID submitted — guard may upload all credentials upfront. */
export function getPendingGuardAccountReviews(guards: SecurityGuard[]): SecurityGuard[] {
  return guards.filter((g) => {
    if (g.isStaff || !isGuardAccountPending(g) || !isSelfSubmittedGuardAccount(g)) return false;
    return getGuardActivationChecklist(g).idSubmitted;
  });
}

export function getPendingGuardsMissingActivationRequirements(guards: SecurityGuard[]): SecurityGuard[] {
  return guards.filter((g) => {
    if (g.isStaff || !isGuardAccountPending(g) || !isSelfSubmittedGuardAccount(g)) return false;
    return !getGuardActivationChecklist(g).idSubmitted;
  });
}

export function guardActivationSummaryLabel(guard: SecurityGuard): string {
  const checklist = getGuardActivationChecklist(guard);
  if (isGuardAccountApproved(guard)) {
    if (!checklist.canStaffActivate) {
      const parts = checklist.staffActivationBlockers.filter((b) => !checklist.staffApprovalBlockers.includes(b));
      if (parts.length > 0) return `Approved — ${parts[0]}`;
      return 'Approved — awaiting guard card';
    }
    return checklist.missingGraceCredentials.length > 0
      ? `Approved — activate (${checklist.missingGraceCredentials.join(', ')} not listed)`
      : 'Approved — ready to activate';
  }
  if (checklist.canStaffApprove) return 'ID and COI verified — ready to approve';
  const parts: string[] = [];
  if (!checklist.idSubmitted) parts.push('ID missing');
  else if (!checklist.idVerified) parts.push('ID unverified');
  else if (guardHasExpiredIdOnFile(guard)) parts.push('ID expired');
  if (!checklist.insuranceSubmitted) parts.push('COI missing');
  else if (!checklist.insuranceVerified) parts.push('COI unverified');
  if (checklist.guardCardSubmitted && !guardMeetsLevel1(guard)) parts.push('Guard card invalid');
  return parts.join(' · ') || 'Awaiting requirements';
}

/**
 * When credential verification is complete, grant marketplace eligibility (active status)
 * with an automatic credential grace window — not a hiring/employment gate.
 */
export function buildMarketplaceEligibilityActivation(
  guard: SecurityGuard,
  state = 'CA'
): SecurityGuard | null {
  if (guard.isStaff) return null;
  const status = getGuardUserStatus(guard);
  if (status !== 'pending' && status !== 'approved') return null;
  if (guardAccountActivationBlockers(guard, state).length > 0) return null;
  const gracePatch = guardCredentialGracePatchForActivation(guard, state);
  return {
    ...guard,
    userStatus: 'active',
    verified: true,
    ...gracePatch,
  };
}
