import { SecurityGuard } from '../types';
import { getGuardActivationChecklist } from './guardAccountActivation';
import {
  CREDENTIAL_NOT_LISTED_OR_ON_FILE_LABEL,
  getCourseUploadStatus,
} from './certStatus';
import {
  getGovernmentIdUploadStatusSummary,
  getGuardIdVerificationStatus,
} from './guardIdentityVerification';
import {
  computePtaUofProgress,
  guardMeets32HourBlock,
  guardMeets32HourBlockVerified,
  guardMeetsPtaUofTrainingVerified,
} from './guardQualification';
import { getCoiUploadStatus, guardInsuranceSubmitted, resolveInsuranceStatus } from './guardInsurance';
import {
  countPtaUofSlotStatuses,
  countThirtyTwoHourCourseSlotStatuses,
  formatCredentialSlotStatusSummary,
} from './certStatus';

export type CredentialSectionStatusTone = 'default' | 'primary' | 'success' | 'warning' | 'danger';

export interface CredentialSectionStatus {
  label: string;
  tone: CredentialSectionStatusTone;
}

function notListedOrOnFileStatus(): CredentialSectionStatus {
  return { label: CREDENTIAL_NOT_LISTED_OR_ON_FILE_LABEL, tone: 'warning' };
}

export function getGuardCardSectionStatus(
  guard: SecurityGuard,
  staffMode = false
): CredentialSectionStatus {
  const checklist = getGuardActivationChecklist(guard);

  if (checklist.guardCardVerified) {
    return { label: 'Verified — on file', tone: 'success' };
  }
  const uploadStatus = getCourseUploadStatus(guard, 'bsis-guard-card');
  if (checklist.guardCardSubmitted) {
    return { label: 'Submitted — pending review', tone: 'warning' };
  }
  if (uploadStatus === 'listed') {
    return staffMode
      ? { label: 'Listed — document photo required', tone: 'warning' }
      : notListedOrOnFileStatus();
  }
  if (uploadStatus === 'on-file') {
    return { label: 'On file', tone: 'primary' };
  }
  return notListedOrOnFileStatus();
}

export function getGovernmentIdSectionStatus(
  guard: SecurityGuard,
  staffMode = false
): CredentialSectionStatus {
  const idStatus = getGuardIdVerificationStatus(guard);
  const checklist = getGuardActivationChecklist(guard);
  const label = getGovernmentIdUploadStatusSummary(guard, { staffMode });

  if (checklist.idVerified) {
    return { label, tone: 'success' };
  }
  if (idStatus === 'rejected') {
    return { label, tone: 'danger' };
  }
  if (checklist.idSubmitted) {
    return { label, tone: 'warning' };
  }
  if (label === 'Not on file' || label === CREDENTIAL_NOT_LISTED_OR_ON_FILE_LABEL) {
    return notListedOrOnFileStatus();
  }
  return { label, tone: 'default' };
}

export function getCoiSectionStatus(guard: SecurityGuard, staffMode = false): CredentialSectionStatus {
  const uploadStatus = getCoiUploadStatus(guard);
  const policy = guard.insurancePolicy;
  const resolved = policy ? resolveInsuranceStatus(policy) : 'not_submitted';

  if (resolved === 'verified') {
    return { label: 'Verified — on file', tone: 'success' };
  }
  if (resolved === 'rejected') {
    return { label: policy?.rejectionReason ?? 'Rejected — resubmit', tone: 'danger' };
  }
  if (uploadStatus === 'expired') {
    return { label: 'On file', tone: 'primary' };
  }
  if (resolved === 'pending' && guardInsuranceSubmitted(guard)) {
    return { label: 'Submitted — pending review', tone: 'warning' };
  }
  if (uploadStatus === 'listed') {
    return staffMode
      ? { label: 'Listed — COI document required', tone: 'warning' }
      : notListedOrOnFileStatus();
  }
  if (uploadStatus === 'on-file') {
    return { label: 'On file', tone: 'primary' };
  }
  return notListedOrOnFileStatus();
}

export function getAggregateSectionStatus(
  summary: string,
  complete: boolean,
  verified = false,
  options?: { expired?: boolean }
): CredentialSectionStatus {
  if (options?.expired) {
    return { label: 'On file', tone: 'primary' };
  }
  if (complete && verified) {
    return { label: 'Verified — on file', tone: 'success' };
  }
  if (complete) {
    return { label: 'On file — pending review', tone: 'warning' };
  }
  return { label: summary, tone: 'warning' };
}

export function getPtaUofSectionStatus(guard: SecurityGuard, staffMode = false): CredentialSectionStatus {
  if (guardMeetsPtaUofTrainingVerified(guard)) {
    return { label: 'Verified — on file', tone: 'success' };
  }
  const progress = computePtaUofProgress(guard);
  const summary = formatCredentialSlotStatusSummary(countPtaUofSlotStatuses(guard));
  if (progress.complete) {
    return { label: 'On file — pending review', tone: 'warning' };
  }
  if (summary === CREDENTIAL_NOT_LISTED_OR_ON_FILE_LABEL) {
    return notListedOrOnFileStatus();
  }
  if (summary === 'On file') {
    return notListedOrOnFileStatus();
  }
  return { label: summary, tone: 'warning' };
}

export function getThirtyTwoHourSectionStatus(guard: SecurityGuard, staffMode = false): CredentialSectionStatus {
  if (guardMeets32HourBlockVerified(guard)) {
    return { label: 'Verified — on file', tone: 'success' };
  }
  const summary = formatCredentialSlotStatusSummary(countThirtyTwoHourCourseSlotStatuses(guard));
  if (guardMeets32HourBlock(guard)) {
    return { label: 'On file — pending review', tone: 'warning' };
  }
  if (summary === CREDENTIAL_NOT_LISTED_OR_ON_FILE_LABEL) {
    return notListedOrOnFileStatus();
  }
  return { label: summary, tone: 'warning' };
}
