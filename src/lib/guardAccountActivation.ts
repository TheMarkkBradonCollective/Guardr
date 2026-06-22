import { Certification, SecurityGuard } from '../types';
import { resolveCertCatalogId } from './certCatalog';
import {
  getGuardIdVerificationStatus,
  guardIdVerificationPhotosComplete,
} from './guardIdentityVerification';
import { guardHasGuardrVerifiedCredential } from './guardQualification';
import { isGuardAccountPending } from './accountStatus';

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
  const idSubmitted = guardIdVerificationPhotosComplete(guard) || idStatus === 'verified';
  const idVerified = guardIdIsVerified(guard);
  const guardCardSubmitted = guardHasGuardCardSubmitted(guard);
  const guardCardVerified = guardHasVerifiedGuardCard(guard, state);

  const blockers: string[] = [];
  if (!idSubmitted) {
    blockers.push('Government ID and identity selfie not submitted');
  } else if (idStatus === 'rejected') {
    blockers.push('ID verification rejected — guard must resubmit');
  } else if (!idVerified) {
    blockers.push('ID verification awaiting staff approval');
  }

  if (!guardCardSubmitted) {
    blockers.push('BSIS Guard Card not uploaded');
  } else if (!guardCardVerified) {
    blockers.push('Guard Card awaiting staff verification');
  }

  return {
    idSubmitted,
    idVerified,
    guardCardSubmitted,
    guardCardVerified,
    canActivate: blockers.length === 0,
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
    if (g.isStaff || !isGuardAccountPending(g)) return false;
    const checklist = getGuardActivationChecklist(g);
    return checklist.idSubmitted && checklist.guardCardSubmitted;
  });
}

/** Pending accounts ready for final activation (ID + guard card both verified). */
export function getGuardsReadyForAccountActivation(guards: SecurityGuard[]): SecurityGuard[] {
  return guards.filter((g) => !g.isStaff && isGuardAccountPending(g) && guardCanActivateAccount(g));
}

/** Pending sign-ups still missing ID or guard card uploads. */
export function getPendingGuardsMissingActivationRequirements(guards: SecurityGuard[]): SecurityGuard[] {
  return guards.filter((g) => {
    if (g.isStaff || !isGuardAccountPending(g)) return false;
    const checklist = getGuardActivationChecklist(g);
    return !checklist.idSubmitted || !checklist.guardCardSubmitted;
  });
}

export function guardActivationSummaryLabel(guard: SecurityGuard): string {
  const checklist = getGuardActivationChecklist(guard);
  if (checklist.canActivate) return 'Ready to activate';
  const parts: string[] = [];
  if (!checklist.idSubmitted) parts.push('ID missing');
  else if (!checklist.idVerified) parts.push('ID pending');
  if (!checklist.guardCardSubmitted) parts.push('Guard card missing');
  else if (!checklist.guardCardVerified) parts.push('Guard card pending');
  return parts.join(' · ') || 'Awaiting requirements';
}
