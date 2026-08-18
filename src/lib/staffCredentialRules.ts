import type { Certification, SecurityGuard } from '../types';
import { getGuardUserStatus } from './accountStatus';
import { certUpdateSubmissionAllowed } from './certRevisionHistory';
import { getGuardIdVerificationStatus, guardGovIdNeedsDocumentTypeSelection } from './guardIdentityVerification';
import { resolveInsuranceStatus } from './guardInsurance';

export const STAFF_CANNOT_SUBMIT_CREDENTIAL_MESSAGE =
  'Staff cannot submit credentials for a guard. Ask the guard to upload, or request an update so they can resubmit.';

export const STAFF_CREDENTIAL_LOCKED_AFTER_DECISION_MESSAGE =
  'This credential is locked after review. Request an update so it can be resubmitted.';

/**
 * Staff may not edit guard credential data. They verify, approve, reject, and
 * request updates — guards upload and resubmit.
 */
export function staffCanEditExistingCredential(_input: {
  guard: Pick<SecurityGuard, 'userStatus' | 'isStaff'>;
  /** Credential review status when applicable. */
  credentialStatus?: 'not_submitted' | 'pending' | 'verified' | 'rejected' | 'expired';
  updateRequested?: boolean;
}): boolean {
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

/** Staff may classify a pending government ID as ID vs driver's license during review. */
export function staffCanSetGovernmentIdDocumentType(
  guard: Pick<SecurityGuard, 'userStatus' | 'isStaff' | 'idVerificationStatus' | 'idDocumentType'>
): boolean {
  if (getGuardUserStatus(guard) === 'blocked') return false;
  const status = getGuardIdVerificationStatus(guard);
  return status === 'pending' && guardGovIdNeedsDocumentTypeSelection(guard);
}

export function staffCanEditGuardGovernmentId(
  guard: Pick<
    SecurityGuard,
    'userStatus' | 'isStaff' | 'idVerificationStatus' | 'idDocumentType' | 'idUpdateRequestedAt'
  >
): boolean {
  return staffCanSetGovernmentIdDocumentType(guard);
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
