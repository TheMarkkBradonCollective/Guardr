import React from 'react';
import { SecurityGuard } from '../../types';
import { getGuardActivationChecklist } from '../../lib/guardAccountActivation';
import {
  guardHasVerifiedIdForWork,
  guardMeetsLevel1,
  guardMeetsPtaUofTraining,
} from '../../lib/guardQualification';
import { getGuardMissingWorkCredentialLabels } from '../../lib/guardMissingCredentials';
import { WfBadge } from '../ui/wireframe';
import { AlertTriangle, Check, Circle } from 'lucide-react';

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

/** Staff-only profile approval checklist — minimum is verified government ID. */
export function StaffGuardActivationChecklistView({ guard }: StaffGuardActivationChecklistViewProps) {
  const checklist = getGuardActivationChecklist(guard);
  const missingWork = getGuardMissingWorkCredentialLabels(guard);

  return (
    <div className="app-checklist-panel">
      <p className="text-sm font-semibold">Profile approval (staff)</p>
      <p className="text-xs text-brand-text-muted leading-relaxed mt-1">
        Minimum to approve: verified government ID. Guard card is the minimum to activate for work — PTA/UOF and
        other credentials can be added later. You will be prompted if anything is still missing.
      </p>
      <div className="app-checklist-steps">
        <StepRow
          done={guardHasVerifiedIdForWork(guard)}
          label="Government ID (verified) — required to approve"
          detail={
            checklist.idVerified
              ? guardHasVerifiedIdForWork(guard)
                ? 'Verified'
                : 'Verified but expired'
              : checklist.idSubmitted
                ? 'Submitted — verify in Credentials'
                : 'Not submitted'
          }
        />
        <StepRow
          done={guardMeetsLevel1(guard)}
          label="BSIS Guard Card (valid) — minimum to work"
          detail={
            guardMeetsLevel1(guard)
              ? 'Valid guard card on file'
              : checklist.guardCardSubmitted
                ? 'On file — confirm current and valid'
                : 'Not uploaded — guard cannot work until added'
          }
        />
      </div>

      {missingWork.length > 0 && (
        <div className="mt-3 pt-3 border-t border-brand-border space-y-2">
          <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Missing for work eligibility
          </p>
          <div className="flex flex-wrap gap-1.5">
            {!guardMeetsLevel1(guard) && <WfBadge tone="warning">Guard card missing</WfBadge>}
            {!guardMeetsPtaUofTraining(guard) && <WfBadge tone="warning">PTA/UOF missing</WfBadge>}
            {missingWork.includes('32-hour BSIS training') && (
              <WfBadge tone="warning">32-hour block missing</WfBadge>
            )}
          </div>
          <p className="text-xs text-brand-text-muted leading-relaxed">
            You can approve once ID is verified; confirm when prompted if guard card or other credentials are
            still missing.
          </p>
        </div>
      )}

      {checklist.canStaffApprove && (
        <p className="text-xs text-brand-primary font-medium pt-3 border-t border-brand-border mt-3">
          {missingWork.length > 0
            ? 'ID verified — you may approve now (you will be asked to confirm missing credentials).'
            : 'All work credentials on file — ready to approve.'}
        </p>
      )}
    </div>
  );
}
