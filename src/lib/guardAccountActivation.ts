import { Certification, SecurityGuard } from '../types';
import { isSelfSubmittedGuardAccount } from './approvalSubmissions';
import { resolveCertCatalogId } from './certCatalog';
import {
  getGuardIdVerificationStatus,
  guardIdVerificationPhotosComplete,
} from './guardIdentityVerification';
import {
  guardHasExpiredGuardCard,
  guardHasExpiredIdOnFile,
  guardHasGuardrVerifiedCredential,
  guardHasIdOnFile,
  guardHasVerifiedIdForWork,
  guardMeetsLevel1,
  guardMeetsPtaUofTraining,
  guardMeetsWorkRequirements,
} from './guardQualification';
import { getGuardUserStatus, isGuardAccountPending } from './accountStatus';

export interface GuardActivationChecklist {
  idSubmitted: boolean;
  idVerified: boolean;
  guardCardSubmitted: boolean;
  guardCardVerified: boolean;
  canActivate: boolean;
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
  return getGuardCardCertifications(guard).length > 0;
}

export function guardHasVerifiedGuardCard(guard: SecurityGuard, state = 'CA'): boolean {
  if (guardHasGuardrVerifiedCredential(guard, 'bsis-guard-card', state)) return true;
  return getGuardCardCertifications(guard).some((c) => c.status === 'verified');
}

export function guardIdIsVerified(guard: SecurityGuard): boolean {
  return getGuardIdVerificationStatus(guard) === 'verified';
}

export function getGuardActivationChecklist(guard: SecurityGuard, state = 'CA'): GuardActivationChecklist {
  const idStatus = getGuardIdVerificationStatus(guard);
  const idSubmitted = guardIdVerificationPhotosComplete(guard) || idStatus === 'verified' || guardHasIdOnFile(guard);
  const idVerified = guardIdIsVerified(guard);
  const guardCardSubmitted = guardHasGuardCardSubmitted(guard);
  const guardCardVerified = guardHasVerifiedGuardCard(guard, state);

  const blockers: string[] = [];
  if (!guard.isStaff && getGuardUserStatus(guard) === 'blocked') {
    blockers.push('Guard application rejected — account blocked');
  } else if (idStatus === 'rejected') {
    blockers.push('ID resubmit requested — profile approval on hold until guard re-uploads');
  } else if (!idSubmitted) {
    blockers.push('Government ID and identity selfie not submitted');
  } else if (guardHasExpiredIdOnFile(guard)) {
    blockers.push('Government ID has expired — guard must upload a valid ID');
  } else if (!guardHasVerifiedIdForWork(guard)) {
    blockers.push('Government ID awaiting staff verification');
  } else if (!guardMeetsLevel1(guard, state)) {
    if (guardHasExpiredGuardCard(guard, state)) {
      blockers.push('BSIS Guard Card has expired — guard must upload a valid card');
    } else if (!guardCardSubmitted) {
      blockers.push('BSIS Guard Card not uploaded');
    } else {
      blockers.push('Valid BSIS Guard Card required to work');
    }
  } else if (!guardMeetsPtaUofTraining(guard)) {
    blockers.push('8-hour Power to Arrest & Appropriate Use of Force training not on file');
  }

  const canActivate = blockers.length === 0 && guardMeetsWorkRequirements(guard, state);

  return {
    idSubmitted,
    idVerified,
    guardCardSubmitted,
    guardCardVerified,
    canActivate,
    blockers,
  };
}

export function guardCanActivateAccount(guard: SecurityGuard, state = 'CA'): boolean {
  if (guard.isStaff) return false;
  return getGuardActivationChecklist(guard, state).canActivate;
}

export function guardAccountActivationBlockers(guard: SecurityGuard, state = 'CA'): string[] {
  return getGuardActivationChecklist(guard, state).blockers;
}

/** Pending sign-ups staff can review — must have submitted ID and guard card. */
export function getPendingGuardAccountReviews(guards: SecurityGuard[]): SecurityGuard[] {
  return guards.filter((g) => {
    if (g.isStaff || !isGuardAccountPending(g) || !isSelfSubmittedGuardAccount(g)) return false;
    const checklist = getGuardActivationChecklist(g);
    return checklist.idSubmitted && checklist.guardCardSubmitted;
  });
}

/** Pending sign-ups still missing ID or guard card uploads. */
export function getPendingGuardsMissingActivationRequirements(guards: SecurityGuard[]): SecurityGuard[] {
  return guards.filter((g) => {
    if (g.isStaff || !isGuardAccountPending(g) || !isSelfSubmittedGuardAccount(g)) return false;
    const checklist = getGuardActivationChecklist(g);
    return !checklist.idSubmitted || !checklist.guardCardSubmitted;
  });
}

export function guardActivationSummaryLabel(guard: SecurityGuard): string {
  const checklist = getGuardActivationChecklist(guard);
  if (checklist.canActivate) return 'Ready to approve';
  const parts: string[] = [];
  if (!checklist.idSubmitted) parts.push('ID missing');
  else if (!checklist.idVerified) parts.push('ID unverified');
  else if (guardHasExpiredIdOnFile(guard)) parts.push('ID expired');
  if (!checklist.guardCardSubmitted) parts.push('Guard card missing');
  else if (!guardMeetsLevel1(guard)) parts.push('Guard card invalid');
  if (!guardMeetsPtaUofTraining(guard)) parts.push('PTA/UOF missing');
  return parts.join(' · ') || 'Awaiting requirements';
}
