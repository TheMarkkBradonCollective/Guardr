import React from 'react';
import { SecurityGuard } from '../../types';
import { getGuardActivationChecklist } from '../../lib/guardAccountActivation';
import {
  guardHasVerifiedIdForWork,
  guardMeets32HourBlock,
  guardMeetsLevel1,
  guardMeetsPtaUofTraining,
} from '../../lib/guardQualification';
import { isGuardAccountApproved } from '../../lib/accountStatus';
import { isGuardAccountActive } from '../../lib/guardAccountActivation';
import { guardHasValidInsurance, guardHasInsuranceSubmitted } from '../../lib/guardInsurance';
import { Check, Circle } from 'lucide-react';

interface StaffGuardActivationChecklistViewProps {
  guard: SecurityGuard;
}

function StepRow({
  done,
  label,
  detail,
}: {
  done: boolean;
  label: string;
  detail?: string;
}) {
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

function LicenseStepRow({
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
  if (checklist.guardCardVerified) return 'Verified by staff';
  if (guardMeetsLevel1(guard) || checklist.guardCardSubmitted) return 'On file — staff verification required';
  return 'Not on file';
}

/** Staff: all five on file for approval; guard card and weapons permits require staff verification. */
export function StaffGuardActivationChecklistView({ guard }: StaffGuardActivationChecklistViewProps) {
  const checklist = getGuardActivationChecklist(guard);
  const approved = isGuardAccountApproved(guard);
  const active = isGuardAccountActive(guard);
  const readyForApproval = checklist.canStaffApprove;

  return (
    <div className="app-checklist-panel">
      <p className="text-sm font-semibold">Marketplace eligibility (staff)</p>
      <div className="app-checklist-steps">
        <LicenseStepRow
          onFile={checklist.idSubmitted}
          verified={guardHasVerifiedIdForWork(guard)}
          label="1. Government ID"
          detail={idStepDetail(guard, checklist)}
        />
        <LicenseStepRow
          onFile={checklist.insuranceSubmitted}
          verified={guardHasValidInsurance(guard)}
          label="2. Certificate of Insurance"
          detail={coiStepDetail(guard, checklist)}
        />
        <LicenseStepRow
          onFile={guardMeetsLevel1(guard) || checklist.guardCardSubmitted}
          verified={checklist.guardCardVerified}
          label="3. BSIS Guard Card"
          detail={guardCardStepDetail(guard, checklist)}
        />
        <StepRow
          done={guardMeetsPtaUofTraining(guard)}
          label="4. PTA/UOF training"
          detail={guardMeetsPtaUofTraining(guard) ? 'On file — no staff verification required' : 'Not on file'}
        />
        <StepRow
          done={guardMeets32HourBlock(guard)}
          label="5. 32-hour BSIS block"
          detail={guardMeets32HourBlock(guard) ? 'On file — no staff verification required' : 'Not on file'}
        />
      </div>

      {!active && (
        <div className="pt-3 mt-3 border-t border-brand-border space-y-2 text-xs">
          <p className={approved ? 'text-brand-text-muted' : 'text-brand-primary font-medium'}>
            {approved
              ? readyForApproval
                ? 'Ready to grant marketplace eligibility'
                : 'Guard must re-upload missing credentials before marketplace eligibility'
              : readyForApproval
                ? 'All five credentials on file and guard card verified — ready to approve profile'
                : 'All five credentials must be on file and the guard card verified before profile approval'}
          </p>
          {!readyForApproval && checklist.staffApprovalBlockers.length > 0 && (
            <p className="text-amber-400 leading-relaxed">{checklist.staffApprovalBlockers.join(' · ')}</p>
          )}
          {readyForApproval && !approved && (
            <p className="text-brand-text-muted leading-relaxed">
              Verify guard cards and weapons permits so clients can see Guardr confirmed they are legitimate.
              PTA/UOF and 32-hour training only need to be on file.
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
