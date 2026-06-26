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
import { isGuardAccountApproved } from '../../lib/accountStatus';
import { isGuardAccountActive } from '../../lib/guardAccountActivation';
import { guardHasValidInsurance, guardHasInsuranceSubmitted } from '../../lib/guardInsurance';
import { Check, Circle } from 'lucide-react';

interface StaffGuardActivationChecklistViewProps {
  guard: SecurityGuard;
}

function StepRow({
  onFile,
  verified,
  label,
  detail,
}: {
  onFile: boolean;
  verified: boolean;
  label: string;
  detail?: string;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      {onFile ? (
        <Check className={`w-4 h-4 shrink-0 mt-0.5 ${verified ? 'text-emerald-400' : 'text-amber-400'}`} />
      ) : (
        <Circle className="w-4 h-4 text-brand-text-muted shrink-0 mt-0.5" />
      )}
      <div>
        <span className={onFile ? 'text-brand-text' : 'text-brand-text-muted'}>{label}</span>
        {detail && <p className="text-xs text-brand-text-muted mt-0.5">{detail}</p>}
      </div>
    </div>
  );
}

function idStepDetail(guard: SecurityGuard, checklist: ReturnType<typeof getGuardActivationChecklist>): string {
  if (guardHasVerifiedIdForWork(guard)) return 'On file — verified for clients';
  if (checklist.idSubmitted) return 'On file — verify for client-facing trust';
  return 'Not on file';
}

function coiStepDetail(guard: SecurityGuard, checklist: ReturnType<typeof getGuardActivationChecklist>): string {
  if (guardHasValidInsurance(guard)) return 'On file — verified for clients';
  if (guardHasInsuranceSubmitted(guard) || checklist.insuranceSubmitted) return 'On file — verify for client-facing trust';
  return 'Not on file';
}

function guardCardStepDetail(guard: SecurityGuard, checklist: ReturnType<typeof getGuardActivationChecklist>): string {
  if (checklist.guardCardVerified) return 'On file — verified for clients';
  if (guardMeetsLevel1(guard) || checklist.guardCardSubmitted) return 'On file — verify for client-facing trust';
  return 'Not on file';
}

function ptaStepDetail(guard: SecurityGuard): string {
  if (guardMeetsPtaUofTrainingVerified(guard)) return 'On file — verified for clients';
  if (guardMeetsPtaUofTraining(guard)) return 'On file — verify for client-facing trust';
  return 'Not on file';
}

function block32StepDetail(guard: SecurityGuard): string {
  if (guardMeets32HourBlockVerified(guard)) return 'On file — verified for clients';
  if (guardMeets32HourBlock(guard)) return 'On file — verify for client-facing trust';
  return 'Not on file';
}

/** Staff: approve when all five are on file; verify each cert for client-facing trust. */
export function StaffGuardActivationChecklistView({ guard }: StaffGuardActivationChecklistViewProps) {
  const checklist = getGuardActivationChecklist(guard);
  const approved = isGuardAccountApproved(guard);
  const active = isGuardAccountActive(guard);
  const allOnFile = checklist.canStaffApprove;

  return (
    <div className="app-checklist-panel">
      <p className="text-sm font-semibold">Marketplace eligibility (staff)</p>
      <div className="app-checklist-steps">
        <StepRow
          onFile={checklist.idSubmitted}
          verified={guardHasVerifiedIdForWork(guard)}
          label="1. Government ID"
          detail={idStepDetail(guard, checklist)}
        />
        <StepRow
          onFile={checklist.insuranceSubmitted}
          verified={guardHasValidInsurance(guard)}
          label="2. Certificate of Insurance"
          detail={coiStepDetail(guard, checklist)}
        />
        <StepRow
          onFile={guardMeetsLevel1(guard) || checklist.guardCardSubmitted}
          verified={checklist.guardCardVerified}
          label="3. BSIS Guard Card"
          detail={guardCardStepDetail(guard, checklist)}
        />
        <StepRow
          onFile={guardMeetsPtaUofTraining(guard)}
          verified={guardMeetsPtaUofTrainingVerified(guard)}
          label="4. PTA/UOF training"
          detail={ptaStepDetail(guard)}
        />
        <StepRow
          onFile={guardMeets32HourBlock(guard)}
          verified={guardMeets32HourBlockVerified(guard)}
          label="5. 32-hour BSIS block"
          detail={block32StepDetail(guard)}
        />
      </div>

      {!active && (
        <div className="pt-3 mt-3 border-t border-brand-border space-y-2 text-xs">
          <p className={approved ? 'text-brand-text-muted' : 'text-brand-primary font-medium'}>
            {approved
              ? allOnFile
                ? 'All five credentials on file — ready to grant marketplace eligibility'
                : 'Guard must re-upload missing credentials before marketplace eligibility'
              : allOnFile
                ? 'All five credentials on file — ready to approve profile'
                : 'All five credentials must be on file before profile approval'}
          </p>
          {!allOnFile && checklist.staffApprovalBlockers.length > 0 && (
            <p className="text-amber-400 leading-relaxed">{checklist.staffApprovalBlockers.join(' · ')}</p>
          )}
          {allOnFile && !approved && (
            <p className="text-brand-text-muted leading-relaxed">
              Verify each credential below so clients can see Guardr has confirmed they are legitimate.
            </p>
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
