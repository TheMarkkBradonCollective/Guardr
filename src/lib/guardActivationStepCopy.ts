import { SecurityGuard } from '../types';
import { isGuardAccountApproved } from './accountStatus';
import { getGuardActivationChecklist, getGuardCardCertifications } from './guardAccountActivation';
import { guardInsuranceActivationDetail } from './guardInsurance';
import {
  formatThirtyTwoHourCourseProgressCounts,
  getQualificationProgress,
  guardHasExpiredIdOnFile,
  guardHasVerifiedIdForWork,
  guardMeets32HourBlock,
  guardMeets32HourBlockVerified,
  guardMeetsLevel1,
  guardMeetsPtaUofTraining,
  guardMeetsPtaUofTrainingVerified,
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

export function guardActivationPtaStepDetail(guard: SecurityGuard): string {
  if (guardMeetsPtaUofTrainingVerified(guard)) {
    return 'PTA/UOF training verified by staff';
  }
  if (guardMeetsPtaUofTraining(guard)) {
    return 'On file — awaiting staff verification';
  }
  return `Upload your PTA/UOF certificate. ${PTA_UOF_UPLOAD_GUIDANCE}`;
}

export function guardActivation32HourStepDetail(guard: SecurityGuard): string {
  const progress = getQualificationProgress(guard);

  if (guardMeets32HourBlockVerified(guard)) {
    return progress.thirtyTwoHourRollup
      ? '32-hour completion certificate verified by staff'
      : `All ${progress.total32HourCourses} courses verified by staff`;
  }
  if (guardMeets32HourBlock(guard)) {
    return progress.thirtyTwoHourRollup
      ? '32-hour completion certificate on file — awaiting staff verification'
      : `All ${progress.total32HourCourses} courses on file — awaiting staff verification`;
  }
  if (progress.thirtyTwoHourRollup || progress.uploaded32HourCount > 0) {
    return `${formatThirtyTwoHourCourseProgressCounts(progress)} — keep uploading courses`;
  }
  return 'Upload all 9 course certificates or one 32-hour completion certificate';
}

export function guardActivationCoiStepDetail(guard: SecurityGuard): string {
  return guardInsuranceActivationDetail(guard).detail;
}
