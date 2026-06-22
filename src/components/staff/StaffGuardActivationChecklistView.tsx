import React from 'react';
import { SecurityGuard } from '../../types';
import { getGuardActivationChecklist } from '../../lib/guardAccountActivation';
import { CREDENTIAL_GRACE_PERIOD_HOURS } from '../../lib/guardCredentialGrace';
import { getGuardMissingGraceCredentialLabels } from '../../lib/guardMissingCredentials';
import {
  guardHasVerifiedIdForWork,
  guardMeetsLevel1,
  guardMeetsPtaUofTraining,
} from '../../lib/guardQualification';
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

/** Staff-only activation checklist — guard card is mandatory; optional creds get grace. */
export function StaffGuardActivationChecklistView({ guard }: StaffGuardActivationChecklistViewProps) {
  const checklist = getGuardActivationChecklist(guard);
  const missingGrace = getGuardMissingGraceCredentialLabels(guard);

  return (
    <div className="app-checklist-panel">
      <p className="text-sm font-semibold">Profile activation (staff)</p>
      <p className="text-xs text-brand-text-muted leading-relaxed mt-1">
        Required to activate: verified government ID and valid BSIS Guard Card (no grace for guard card).
        Optional credentials (PTA/UOF, 32-hour) can be waived for {CREDENTIAL_GRACE_PERIOD_HOURS} hours — the
        guard is notified and auto-deactivated if not added in time.
      </p>
      <div className="app-checklist-steps">
        <StepRow
          done={guardHasVerifiedIdForWork(guard)}
          label="Government ID (verified)"
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
          label="BSIS Guard Card (valid) — mandatory"
          detail={
            guardMeetsLevel1(guard)
              ? 'Valid guard card on file'
              : checklist.guardCardSubmitted
                ? 'On file — confirm current and valid'
                : 'Not uploaded — cannot activate without guard card'
          }
        />
      </div>

      {missingGrace.length > 0 && (
        <div className="mt-3 pt-3 border-t border-brand-border space-y-2">
          <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Optional — {CREDENTIAL_GRACE_PERIOD_HOURS}-hour grace if missing
          </p>
          <div className="flex flex-wrap gap-1.5">
            {!guardMeetsPtaUofTraining(guard) && <WfBadge tone="warning">PTA/UOF missing</WfBadge>}
            {missingGrace.includes('32-hour BSIS training') && (
              <WfBadge tone="warning">32-hour block missing</WfBadge>
            )}
          </div>
          <p className="text-xs text-brand-text-muted leading-relaxed">
            You will be asked to confirm activation. The guard can work during the grace period but must upload
            these credentials before auto-deactivation.
          </p>
        </div>
      )}

      {checklist.canStaffApprove && (
        <p className="text-xs text-brand-primary font-medium pt-3 border-t border-brand-border mt-3">
          {missingGrace.length > 0
            ? `ID and guard card met — you may activate with a ${CREDENTIAL_GRACE_PERIOD_HOURS}-hour grace for missing credentials.`
            : 'All credentials on file — ready to activate.'}
        </p>
      )}
    </div>
  );
}
