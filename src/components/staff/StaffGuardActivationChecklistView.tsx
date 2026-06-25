import React from 'react';
import { SecurityGuard } from '../../types';
import { getGuardActivationChecklist } from '../../lib/guardAccountActivation';
import {
  guardHasVerifiedIdForWork,
  guardMeets32HourBlock,
  guardMeets32HourBlockVerified,
  guardMeetsLevel1,
  guardMeetsPtaUofTraining,
  guardMeetsPtaUofTrainingVerified,
} from '../../lib/guardQualification';
import { isGuardAccountActive, isGuardAccountApproved } from '../../lib/accountStatus';
import { guardHasValidInsurance, guardHasInsuranceSubmitted } from '../../lib/guardInsurance';
import { Check, Circle } from 'lucide-react';

interface StaffGuardActivationChecklistViewProps {
  guard: SecurityGuard;
}

function StepRow({ done, label, detail }: { done: boolean; label: string; detail?: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {done ? (
        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
      ) : (
        <Circle className="w-4 h-4 text-brand-text-muted shrink-0 mt-0.5" />
      )}
      <div>
        <span className={done ? 'text-brand-text' : 'text-brand-text-muted'}>{label}</span>
        {detail && <p className="text-xs text-brand-text-muted mt-0.5">{detail}</p>}
      </div>
    </div>
  );
}

function idStepDetail(guard: SecurityGuard, checklist: ReturnType<typeof getGuardActivationChecklist>): string {
  if (guardHasVerifiedIdForWork(guard)) return 'Verified by staff';
  if (checklist.idSubmitted) return 'On file — verify below';
  return 'Not on file';
}

function coiStepDetail(guard: SecurityGuard, checklist: ReturnType<typeof getGuardActivationChecklist>): string {
  if (guardHasValidInsurance(guard)) return 'Verified by staff';
  if (guardHasInsuranceSubmitted(guard) || checklist.insuranceSubmitted) return 'On file — verify below';
  return 'Not on file';
}

function guardCardStepDetail(guard: SecurityGuard, checklist: ReturnType<typeof getGuardActivationChecklist>): string {
  if (checklist.guardCardVerified) return 'Verified by staff';
  if (guardMeetsLevel1(guard) || checklist.guardCardSubmitted) return 'On file — verify below';
  return 'Not on file';
}

function ptaStepDetail(guard: SecurityGuard): string {
  if (guardMeetsPtaUofTrainingVerified(guard)) return 'Verified by staff';
  if (guardMeetsPtaUofTraining(guard)) return 'On file — verify below';
  return 'Not on file';
}

function block32StepDetail(guard: SecurityGuard): string {
  if (guardMeets32HourBlockVerified(guard)) return 'Verified by staff';
  if (guardMeets32HourBlock(guard)) return 'On file — verify below';
  return 'Not on file';
}

/** Staff: approve after ID + COI + guard card verified; activate after training certs verified. */
export function StaffGuardActivationChecklistView({ guard }: StaffGuardActivationChecklistViewProps) {
  const checklist = getGuardActivationChecklist(guard);
  const approved = isGuardAccountApproved(guard);
  const active = isGuardAccountActive(guard);

  const coreVerified =
    guardHasVerifiedIdForWork(guard) && guardHasValidInsurance(guard) && checklist.guardCardVerified;
  const trainingVerified =
    guardMeetsPtaUofTrainingVerified(guard) && guardMeets32HourBlockVerified(guard);

  return (
    <div className="app-checklist-panel">
      <p className="text-sm font-semibold">Marketplace eligibility (staff)</p>
      <div className="app-checklist-steps">
        <StepRow
          done={guardHasVerifiedIdForWork(guard)}
          label="1. Government ID — verified by staff"
          detail={idStepDetail(guard, checklist)}
        />
        <StepRow
          done={guardHasValidInsurance(guard)}
          label="2. Certificate of Insurance — verified by staff"
          detail={coiStepDetail(guard, checklist)}
        />
        <StepRow
          done={checklist.guardCardVerified}
          label="3. BSIS Guard Card — verified by staff"
          detail={guardCardStepDetail(guard, checklist)}
        />
        <StepRow
          done={guardMeetsPtaUofTrainingVerified(guard)}
          label="4. PTA/UOF training — verified by staff"
          detail={ptaStepDetail(guard)}
        />
        <StepRow
          done={guardMeets32HourBlockVerified(guard)}
          label="5. 32-hour BSIS block — verified by staff"
          detail={block32StepDetail(guard)}
        />
      </div>

      {!active && (
        <div className="pt-3 mt-3 border-t border-brand-border space-y-2 text-xs">
          <p className={approved ? 'text-brand-text-muted' : 'text-brand-primary font-medium'}>
            {approved
              ? trainingVerified
                ? 'All credentials verified — ready to grant marketplace eligibility'
                : 'Verify PTA/UOF and 32-hour training before activation'
              : coreVerified
                ? 'ID, COI, and guard card verified — ready to approve profile'
                : 'Verify government ID, COI, and guard card before profile approval'}
          </p>
          {approved && !trainingVerified && checklist.staffActivationBlockers.length > 0 && (
            <p className="text-amber-400 leading-relaxed">
              {checklist.staffActivationBlockers
                .filter((b) => !checklist.staffApprovalBlockers.includes(b))
                .join(' · ')}
            </p>
          )}
          {!approved && !coreVerified && checklist.staffApprovalBlockers.length > 0 && (
            <p className="text-amber-400 leading-relaxed">{checklist.staffApprovalBlockers.join(' · ')}</p>
          )}
        </div>
      )}
      {active && (
        <p className="text-xs text-emerald-400 font-medium pt-3 mt-3 border-t border-brand-border">
          Marketplace eligibility granted — account active
        </p>
      )}
    </div>
  );
}
