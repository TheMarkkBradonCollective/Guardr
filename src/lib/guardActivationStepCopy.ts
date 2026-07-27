import { SecurityGuard } from '../types';
import { isGuardAccountApproved } from './accountStatus';
import { getGuardActivationChecklist, getGuardCardCertifications } from './guardAccountActivation';
import { guardInsuranceActivationDetail } from './guardInsurance';
import {
  getQualificationProgress,
  guardHasExpiredIdOnFile,
  guardHasVerifiedIdForWork,
  guardMeetsContinuingEducation,
  guardMeetsLevel1,
  guardMeetsMandatoryTraining,
  PTA_UOF_UPLOAD_GUIDANCE,
} from './guardQualification';
import { certImageIsLocked } from './certImagePolicy';

function guardCardAwaitingReview(guard: SecurityGuard): boolean {
  return getGuardCardCertifications(guard).some(
    (cert) => cert.status === 'pending' && certImageIsLocked(cert)
  );
}

export function guardActivationIdStepDetail(guard: SecurityGuard): string {
  const checklist = getGuardActivationChecklist(guard);
  const approved = isGuardAccountApproved(guard);

  if (guardHasVerifiedIdForWork(guard)) {
    return approved ? 'Verified by staff' : 'Verified by staff — awaiting profile approval';
  }
  if (checklist.idVerified && guardHasExpiredIdOnFile(guard)) {
    return 'Verified — expired; upload a current government ID';
  }
  if (checklist.idSubmitted) {
    return 'Submitted — awaiting staff verification';
  }
  return 'Upload front, back, and identity selfie';
}

export function guardActivationGuardCardStepDetail(guard: SecurityGuard): string {
  const checklist = getGuardActivationChecklist(guard);

  if (checklist.guardCardVerified) {
    return 'Verified by staff';
  }
  if (guardCardAwaitingReview(guard)) {
    return 'Submitted — awaiting staff verification';
  }
  if (guardMeetsLevel1(guard)) {
    return 'On file — awaiting staff verification';
  }
  return 'Upload your guard card document photo';
}

/** @deprecated Use guardActivationMandatoryTrainingStepDetail */
export function guardActivationPtaStepDetail(guard: SecurityGuard): string {
  return guardActivationMandatoryTrainingStepDetail(guard);
}

export function guardActivationMandatoryTrainingStepDetail(guard: SecurityGuard): string {
  if (guardMeetsMandatoryTraining(guard)) {
    return 'PTA/UOF mandatory training on file';
  }
  return `Upload your PTA/UOF certificate. ${PTA_UOF_UPLOAD_GUIDANCE}`;
}

/** @deprecated Use guardActivationCeStepDetail */
export function guardActivation32HourStepDetail(guard: SecurityGuard): string {
  return guardActivationCeStepDetail(guard);
}

export function guardActivationCeStepDetail(guard: SecurityGuard): string {
  const progress = getQualificationProgress(guard);

  if (guardMeetsContinuingEducation(guard)) {
    return `All ${progress.total32HourCourses} Continuing Education courses on file`;
  }
  if (progress.uploaded32HourCount > 0) {
    return `${progress.uploaded32HourCount} of ${progress.total32HourCourses} Continuing Education courses on file — keep uploading`;
  }
  return 'Upload all 9 certificates in the 32-hour BSIS Continuing Education package (after PTA/UOF)';
}

export function guardActivationCoiStepDetail(guard: SecurityGuard): string {
  return guardInsuranceActivationDetail(guard).detail;
}
