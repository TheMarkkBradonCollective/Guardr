import { SecurityGuard } from '../types';
import { getGuardActivationChecklist } from './guardAccountActivation';
import { guardInsuranceActivationDetail, guardInsuranceSubmitted } from './guardInsurance';
import {
  getQualificationProgress,
  guardHasVerifiedIdForWork,
  guardMeetsContinuingEducation,
  guardMeetsLevel1,
  guardMeetsMandatoryTraining,
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

  const cePartial =
    !ceDone && (qual.uploaded32HourCount > 0 || qual.listed32HourCount > 0);

  let cePoints = 0;
  if (ceDone) {
    cePoints = stepWeight;
  } else if (cePartial) {
    cePoints = stepWeight * Math.max(0.25, (qual.continuingEducationProgressPercent ?? 0) / 100);
  }

  const percent = Math.round(
    Math.min(
      100,
      requirementPoints(idDone, !idDone && checklist.idSubmitted, stepWeight) +
        requirementPoints(coiDone, !coiDone && guardInsuranceSubmitted(guard), stepWeight) +
        requirementPoints(cardDone, !cardDone && checklist.guardCardSubmitted, stepWeight) +
        requirementPoints(
          mandatoryDone,
          !mandatoryDone && (qual.ptaUofCombined || qual.legacyPta || qual.legacyUof),
          stepWeight
        ) +
        cePoints
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
