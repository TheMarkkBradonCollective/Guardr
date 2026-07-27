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
  const progress = getQualificationProgress(guard);

  if (guardMeetsMandatoryTraining(guard)) {
    return 'PTA/UOF and mandatory courses on file';
  }
  if (progress.ptaUofTraining && !progress.mandatoryCoursesComplete) {
    return `PTA/UOF on file — upload ${progress.totalMandatoryCourses} mandatory courses (${progress.uploadedMandatoryCount} of ${progress.totalMandatoryCourses} on file)`;
  }
  if (progress.mandatoryCoursesComplete && !progress.ptaUofTraining) {
    return `Mandatory courses on file — upload PTA/UOF. ${PTA_UOF_UPLOAD_GUIDANCE}`;
  }
  if (progress.uploadedMandatoryCount > 0 || progress.thirtyTwoHourRollup) {
    return `Mandatory courses ${progress.uploadedMandatoryCount} of ${progress.totalMandatoryCourses} — also upload PTA/UOF`;
  }
  return `Upload PTA/UOF and the 4 mandatory BSIS courses. ${PTA_UOF_UPLOAD_GUIDANCE}`;
}

/** @deprecated Use guardActivationCeStepDetail */
export function guardActivation32HourStepDetail(guard: SecurityGuard): string {
  return guardActivationCeStepDetail(guard);
}

export function guardActivationCeStepDetail(guard: SecurityGuard): string {
  if (guardMeetsContinuingEducation(guard)) {
    return '8-hour continuing education on file';
  }
  return 'Upload your 8-hour BSIS Continuing Education / refresher certificate';
}

export function guardActivationCoiStepDetail(guard: SecurityGuard): string {
  return guardInsuranceActivationDetail(guard).detail;
}
