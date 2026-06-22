import { Certification, SecurityGuard } from '../types';
import { isSelfSubmittedGuardAccount } from './approvalSubmissions';
import { certHasDocumentProof } from './certImagePolicy';
import { resolveCertCatalogId } from './certCatalog';
import { getGuardMissingWorkCredentialLabels } from './guardMissingCredentials';
import {
  getGuardIdVerificationStatus,
  guardIdVerificationPhotosComplete,
} from './guardIdentityVerification';
import {
  guardHasExpiredIdOnFile,
  guardHasGuardrVerifiedCredential,
  guardHasIdOnFile,
  guardHasVerifiedIdForWork,
  guardMeetsWorkRequirements,
} from './guardQualification';
import { getGuardUserStatus, isGuardAccountPending } from './accountStatus';

export interface GuardActivationChecklist {
  idSubmitted: boolean;
  idVerified: boolean;
  guardCardSubmitted: boolean;
  guardCardVerified: boolean;
  /** Guard-facing — all work requirements met (ID, guard card, PTA/UOF). */
  canActivate: boolean;
  /** Staff can approve with verified government ID only. */
  canStaffApprove: boolean;
  /** Hard blockers preventing staff profile approval. */
  staffApprovalBlockers: string[];
  /** Credentials still missing for full work eligibility. */
  missingWorkCredentials: string[];
  /** @deprecated Use staffApprovalBlockers — kept for existing staff UI call sites. */
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
  if (guardHasGuardrVerifiedCredential(guard, 'bsis-guard-card', state)) return true;
  return getGuardCardCertifications(guard).some((c) => c.status === 'verified');
}

export function guardIdIsVerified(guard: SecurityGuard): boolean {
  return getGuardIdVerificationStatus(guard) === 'verified';
}

function buildStaffApprovalBlockers(guard: SecurityGuard, _state = 'CA'): string[] {
  const idStatus = getGuardIdVerificationStatus(guard);
  const blockers: string[] = [];

  if (!guard.isStaff && getGuardUserStatus(guard) === 'blocked') {
    blockers.push('Guard application rejected — account blocked');
  } else if (idStatus === 'rejected') {
    blockers.push('ID resubmit requested — profile approval on hold until guard re-uploads');
  } else if (!guardIdVerificationPhotosComplete(guard) && idStatus !== 'verified' && !guardHasIdOnFile(guard)) {
    blockers.push('Government ID and identity selfie not submitted');
  } else if (guardHasExpiredIdOnFile(guard)) {
    blockers.push('Government ID has expired — guard must upload a valid ID');
  } else if (!guardHasVerifiedIdForWork(guard)) {
    blockers.push('Government ID awaiting staff verification');
  }

  return blockers;
}

export function getGuardActivationChecklist(guard: SecurityGuard, state = 'CA'): GuardActivationChecklist {
  const idStatus = getGuardIdVerificationStatus(guard);
  const idSubmitted = guardIdVerificationPhotosComplete(guard) || idStatus === 'verified' || guardHasIdOnFile(guard);
  const idVerified = guardIdIsVerified(guard);
  const guardCardSubmitted = guardHasGuardCardSubmitted(guard);
  const guardCardVerified = guardHasVerifiedGuardCard(guard, state);
  const staffApprovalBlockers = buildStaffApprovalBlockers(guard, state);
  const missingWorkCredentials = getGuardMissingWorkCredentialLabels(guard, state);

  const canStaffApprove = staffApprovalBlockers.length === 0;
  const canActivate = guardMeetsWorkRequirements(guard, state);

  return {
    idSubmitted,
    idVerified,
    guardCardSubmitted,
    guardCardVerified,
    canActivate,
    canStaffApprove,
    staffApprovalBlockers,
    missingWorkCredentials,
    blockers: staffApprovalBlockers,
  };
}

/** Guard-facing — all work requirements met. */
export function guardCanActivateAccount(guard: SecurityGuard, state = 'CA'): boolean {
  if (guard.isStaff) return false;
  return getGuardActivationChecklist(guard, state).canActivate;
}

/** Staff-only — verified government ID minimum. */
export function guardCanStaffApproveProfile(guard: SecurityGuard, state = 'CA'): boolean {
  if (guard.isStaff) return false;
  return getGuardActivationChecklist(guard, state).canStaffApprove;
}

export function guardAccountActivationBlockers(guard: SecurityGuard, state = 'CA'): string[] {
  return getGuardActivationChecklist(guard, state).staffApprovalBlockers;
}

/** Pending sign-ups staff can review — must have submitted government ID. */
export function getPendingGuardAccountReviews(guards: SecurityGuard[]): SecurityGuard[] {
  return guards.filter((g) => {
    if (g.isStaff || !isGuardAccountPending(g) || !isSelfSubmittedGuardAccount(g)) return false;
    const checklist = getGuardActivationChecklist(g);
    return checklist.idSubmitted;
  });
}

/** Pending sign-ups still missing government ID uploads. */
export function getPendingGuardsMissingActivationRequirements(guards: SecurityGuard[]): SecurityGuard[] {
  return guards.filter((g) => {
    if (g.isStaff || !isGuardAccountPending(g) || !isSelfSubmittedGuardAccount(g)) return false;
    const checklist = getGuardActivationChecklist(g);
    return !checklist.idSubmitted;
  });
}

export function guardActivationSummaryLabel(guard: SecurityGuard): string {
  const checklist = getGuardActivationChecklist(guard);
  if (checklist.canActivate) return 'Ready to approve';
  if (checklist.canStaffApprove) {
    return checklist.missingWorkCredentials.length > 0
      ? `Missing: ${checklist.missingWorkCredentials.join(', ')}`
      : 'ID verified — ready to approve';
  }
  const parts: string[] = [];
  if (!checklist.idSubmitted) parts.push('ID missing');
  else if (!checklist.idVerified) parts.push('ID unverified');
  else if (guardHasExpiredIdOnFile(guard)) parts.push('ID expired');
  return parts.join(' · ') || 'Awaiting requirements';
}
