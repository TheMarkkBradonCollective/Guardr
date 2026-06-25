import { SecurityGuard } from '../types';
import { isGuardAccountApproved } from './accountStatus';
import { getGuardActivationChecklist } from './guardAccountActivation';
import { guardInsuranceActivationDetail, guardInsuranceSubmitted } from './guardInsurance';
import {
  getQualificationProgress,
  guardHasVerifiedIdForWork,
  guardMeets32HourBlock,
  guardMeetsLevel1,
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
  const approved = isGuardAccountApproved(guard);
  const stepWeight = 100 / GUARD_APPLICATION_REQUIREMENT_COUNT;

  const idDone = approved || guardHasVerifiedIdForWork(guard);
  const coiDone = coi.done;
  const cardDone = guardMeetsLevel1(guard, state);
  const ptaDone = guardMeetsPtaUofTraining(guard);
  const blockDone = guardMeets32HourBlock(guard);

  const blockPartial =
    !blockDone &&
    (qual.uploaded32HourCount > 0 || qual.listed32HourCount > 0 || qual.thirtyTwoHourRollup);

  let blockPoints = 0;
  if (blockDone) {
    blockPoints = stepWeight;
  } else if (blockPartial) {
    blockPoints = stepWeight * Math.max(0.25, qual.thirtyTwoHourProgressPercent / 100);
  }

  const percent = Math.round(
    Math.min(
      100,
      requirementPoints(idDone, !idDone && checklist.idSubmitted, stepWeight) +
        requirementPoints(coiDone, !coiDone && guardInsuranceSubmitted(guard), stepWeight) +
        requirementPoints(cardDone, !cardDone && checklist.guardCardSubmitted, stepWeight) +
        requirementPoints(
          ptaDone,
          !ptaDone && (qual.ptaUofCombined || qual.legacyPta || qual.legacyUof),
          stepWeight
        ) +
        blockPoints
    )
  );

  const completedRequirements = [idDone, coiDone, cardDone, ptaDone, blockDone].filter(Boolean).length;

  return {
    percent,
    completedRequirements,
    totalRequirements: GUARD_APPLICATION_REQUIREMENT_COUNT,
    requirementLabel: `${completedRequirements} of ${GUARD_APPLICATION_REQUIREMENT_COUNT} requirements complete`,
  };
}
