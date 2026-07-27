import { SecurityGuard } from '../types';
import { getGuardActivationChecklist } from './guardAccountActivation';
import { guardInsuranceActivationDetail, guardInsuranceSubmitted } from './guardInsurance';
import {
  getQualificationProgress,
  guardHasVerifiedIdForWork,
  guardMeetsContinuingEducation,
  guardMeetsLevel1,
  guardMeetsMandatoryTraining,
  guardMeetsPtaUofTraining,
} from './guardQualification';

export const GUARD_APPLICATION_REQUIREMENT_COUNT = 5;

export interface GuardApplicationProgress {
  percent: number;
  completedRequirements: number;
  totalRequirements: number;
  requirementLabel: string;
}

function requirementPoints(done: boolean, partial: boolean, weight: number): number {
  if (done) return weight;
  if (partial) return weight * 0.5;
  return 0;
}

/** Guard-facing % complete for marketplace eligibility application (5 required items). */
export function getGuardApplicationProgress(guard: SecurityGuard, state = 'CA'): GuardApplicationProgress {
  const checklist = getGuardActivationChecklist(guard, state);
  const coi = guardInsuranceActivationDetail(guard);
  const qual = getQualificationProgress(guard, state);
  const stepWeight = 100 / GUARD_APPLICATION_REQUIREMENT_COUNT;

  const idDone = guardHasVerifiedIdForWork(guard);
  const coiDone = coi.done;
  const cardDone = guardMeetsLevel1(guard, state);
  const mandatoryDone = guardMeetsMandatoryTraining(guard);
  const ceDone = guardMeetsContinuingEducation(guard);

  const ptaDone = guardMeetsPtaUofTraining(guard);
  const coursesPartial =
    !mandatoryDone &&
    (qual.uploadedMandatoryCount > 0 ||
      qual.listedMandatoryCount > 0 ||
      qual.thirtyTwoHourRollup ||
      qual.ptaUofCombined ||
      qual.legacyPta ||
      qual.legacyUof);

  let mandatoryPoints = 0;
  if (mandatoryDone) {
    mandatoryPoints = stepWeight;
  } else if (coursesPartial || ptaDone) {
    const ptaShare = ptaDone ? 0.5 : Math.max(0, (qual.ptaUofProgressPercent ?? 0) / 200);
    const courseShare = (qual.mandatoryCourseProgressPercent ?? 0) / 200;
    mandatoryPoints = stepWeight * Math.min(0.95, Math.max(0.2, ptaShare + courseShare));
  }

  const percent = Math.round(
    Math.min(
      100,
      requirementPoints(idDone, !idDone && checklist.idSubmitted, stepWeight) +
        requirementPoints(coiDone, !coiDone && guardInsuranceSubmitted(guard), stepWeight) +
        requirementPoints(cardDone, !cardDone && checklist.guardCardSubmitted, stepWeight) +
        mandatoryPoints +
        requirementPoints(ceDone, !ceDone && Boolean(qual.continuingEducation), stepWeight)
    )
  );

  const completedRequirements = [idDone, coiDone, cardDone, mandatoryDone, ceDone].filter(
    Boolean
  ).length;

  return {
    percent,
    completedRequirements,
    totalRequirements: GUARD_APPLICATION_REQUIREMENT_COUNT,
    requirementLabel: `${completedRequirements} of ${GUARD_APPLICATION_REQUIREMENT_COUNT} requirements complete`,
  };
}
