import { Certification, Client, SecurityGuard } from '../types';
import { getClientAccountStatus } from './accountStatus';
import { certHasDocumentProof } from './certImagePolicy';
import {
  getGuardIdVerificationStatus,
  guardIdVerificationSubmissionReady,
} from './guardIdentityVerification';
import { isUserSubmittedPendingInsurance } from './guardInsurance';

export type SubmissionSource = 'guard' | 'staff' | 'client';

/** Guard account created via self sign-up (not staff-provisioned). */
export function isSelfSubmittedGuardAccount(guard: SecurityGuard): boolean {
  return !guard.isStaff && !guard.mustChangePassword;
}

/** Client account created via self sign-up. Staff-provisioned clients start active. */
export function isSelfSubmittedClientAccount(client: Client): boolean {
  return getClientAccountStatus(client) === 'pending';
}

/** Pending credential uploaded by the guard (not staff on their behalf). */
export function isUserSubmittedPendingCert(cert: Certification, guard: SecurityGuard): boolean {
  if (cert.status !== 'pending') return false;
  if (!certHasDocumentProof(cert)) return false;
  if (cert.submittedByRole === 'staff') return false;
  if (cert.submittedByRole === 'guard') return true;
  return isSelfSubmittedGuardAccount(guard);
}

/** Government ID submitted by the guard (not staff upload). */
export function isGuardSubmittedIdentityVerification(guard: SecurityGuard): boolean {
  if (guard.isStaff) return false;
  if (guard.idSubmittedBy === 'staff') return false;
  if (guard.idSubmittedBy === 'guard') return true;
  return isSelfSubmittedGuardAccount(guard);
}

/** Guard submitted at least one activation item that is awaiting staff review. */
export function guardHasSubmittedItemsForStaffReview(guard: SecurityGuard): boolean {
  if (guard.isStaff) return false;

  const idStatus = getGuardIdVerificationStatus(guard);
  if (
    idStatus === 'pending' &&
    guardIdVerificationSubmissionReady(guard) &&
    isGuardSubmittedIdentityVerification(guard)
  ) {
    return true;
  }

  if (isUserSubmittedPendingInsurance(guard)) return true;

  return guard.certifications.some((cert) => isUserSubmittedPendingCert(cert, guard));
}
