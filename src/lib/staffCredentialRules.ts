import type { Certification, SecurityGuard } from '../types';
import { getGuardUserStatus } from './accountStatus';
import { certUpdateSubmissionAllowed } from './certRevisionHistory';
import { getGuardIdVerificationStatus } from './guardIdentityVerification';
import { resolveInsuranceStatus } from './guardInsurance';

export const STAFF_CANNOT_SUBMIT_CREDENTIAL_MESSAGE =
  'Staff cannot submit credentials for a guard. Ask the guard to upload, or request an update so they can resubmit.';

export const STAFF_CREDENTIAL_LOCKED_AFTER_DECISION_MESSAGE =
  'This credential is locked after review. Request an update so it can be resubmitted.';

/**
 * Staff may edit fields on an existing credential while it is still open
 * (pending / expired) or after Request update reopens it.
 * Once approved or denied (verified / rejected) with no update request,
 * nothing can change in place — staff must request an update so the guard
 * can resubmit. Staff must never create/submit a new credential for a guard.
 */
export function staffCanEditExistingCredential(input: {
  guard: Pick<SecurityGuard, 'userStatus' | 'isStaff'>;
  /** Credential review status when applicable. */
  credentialStatus?: 'not_submitted' | 'pending' | 'verified' | 'rejected' | 'expired';
  updateRequested?: boolean;
}): boolean {
  const { guard, credentialStatus, updateRequested } = input;
  if (guard.isStaff) return false;

  const account = getGuardUserStatus(guard);
  if (account === 'blocked') return false;

  if (updateRequested) return true;
  // No credential yet — creating/submitting is the guard's job.
  if (!credentialStatus || credentialStatus === 'not_submitted') return false;
  if (credentialStatus === 'pending' || credentialStatus === 'expired') return true;
  // Verified or rejected: sealed until staff requests an update / resubmit.
  return false;
}

export function staffCanEditCertification(
  guard: Pick<SecurityGuard, 'userStatus' | 'isStaff'>,
  cert: Pick<Certification, 'status' | 'updateRequestedAt' | 'pendingUpdate'>
): boolean {
  return staffCanEditExistingCredential({
    guard,
    credentialStatus: cert.status,
    updateRequested: certUpdateSubmissionAllowed(cert),
  });
}

export function staffCanEditGuardGovernmentId(
  guard: Pick<
    SecurityGuard,
    'userStatus' | 'isStaff' | 'idVerificationStatus' | 'idUpdateRequestedAt'
  >
): boolean {
  const status = getGuardIdVerificationStatus(guard);
  return staffCanEditExistingCredential({
    guard,
    credentialStatus: status,
    updateRequested: Boolean(guard.idUpdateRequestedAt),
  });
}

export function staffCanEditGuardCoi(
  guard: Pick<SecurityGuard, 'userStatus' | 'isStaff' | 'insurancePolicy'>
): boolean {
  const policy = guard.insurancePolicy;
  if (!policy || policy.status === 'not_submitted') {
    return staffCanEditExistingCredential({ guard, credentialStatus: 'not_submitted' });
  }
  const status = resolveInsuranceStatus(policy);
  return staffCanEditExistingCredential({
    guard,
    credentialStatus: status === 'expired' ? 'expired' : status,
    updateRequested: Boolean(policy.updateRequestedAt),
  });
}
