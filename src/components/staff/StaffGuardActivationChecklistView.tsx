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
  if (checklist.guardCardVerified) return 'Verified for clients';
  if (guardMeetsLevel1(guard) || checklist.guardCardSubmitted) return 'On file — verify for client-facing trust';
  return 'Not on file';
}

function ptaUofStepDetail(guard: SecurityGuard): string {
  if (guardMeetsPtaUofTrainingVerified(guard)) return 'Verified for clients';
  if (guardMeetsPtaUofTraining(guard)) return 'On file — verify for client-facing trust';
  return 'Not on file';
}

function thirtyTwoHourStepDetail(guard: SecurityGuard): string {
  if (guardMeets32HourBlockVerified(guard)) return 'Verified for clients';
  if (guardMeets32HourBlock(guard)) return 'On file — verify for client-facing trust';
  return 'Not on file';
}

/** Staff: approve application first, then verify all five before manual activation. */
export function StaffGuardActivationChecklistView({ guard }: StaffGuardActivationChecklistViewProps) {
  const checklist = getGuardActivationChecklist(guard);
  const approved = isGuardAccountApproved(guard);
  const active = isGuardAccountActive(guard);
  const readyForApplicationApproval = checklist.canStaffApprove;
  const readyForActivation = checklist.canStaffActivate;

  return (
    <div className="app-checklist-panel">
      <p className="text-sm font-semibold">Guard activation (staff)</p>
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
        <LicenseStepRow
          onFile={guardMeetsPtaUofTraining(guard)}
          verified={guardMeetsPtaUofTrainingVerified(guard)}
          label="4. PTA/UOF training"
          detail={ptaUofStepDetail(guard)}
        />
        <LicenseStepRow
          onFile={guardMeets32HourBlock(guard)}
          verified={guardMeets32HourBlockVerified(guard)}
          label="5. 32-hour BSIS block"
          detail={thirtyTwoHourStepDetail(guard)}
        />
      </div>

      {!active && (
        <div className="pt-3 mt-3 border-t border-brand-border space-y-2 text-xs">
          {!approved ? (
            <>
              <p className={readyForApplicationApproval ? 'text-brand-primary font-medium' : 'text-amber-400'}>
                {readyForApplicationApproval
                  ? 'Application ready — approve to unlock credential upload for the guard'
                  : 'Application cannot be approved yet'}
              </p>
              {!readyForApplicationApproval && checklist.staffApprovalBlockers.length > 0 && (
                <p className="text-amber-400 leading-relaxed">{checklist.staffApprovalBlockers.join(' · ')}</p>
              )}
            </>
          ) : (
            <>
              <p className={readyForActivation ? 'text-brand-primary font-medium' : 'text-brand-text-muted'}>
                {readyForActivation
                  ? 'All five credentials verified — ready for staff to grant marketplace eligibility'
                  : 'Guard must upload credentials; Administrators verify each before activation'}
              </p>
              {!readyForActivation && checklist.staffActivationBlockers.length > 0 && (
                <p className="text-amber-400 leading-relaxed">{checklist.staffActivationBlockers.join(' · ')}</p>
              )}
            </>
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
