import React from 'react';
import { SecurityGuard } from '../../types';
import { getGuardActivationChecklist, guardHasVerifiedGuardCard } from '../../lib/guardAccountActivation';
import { getGuardMissingGraceCredentialLabels } from '../../lib/guardMissingCredentials';
import {
  guardHasVerifiedIdForWork,
  guardMeetsLevel1,
  guardMeetsPtaUofTrainingListed,
  guardMeets32HourBlockListed,
} from '../../lib/guardQualification';
import { isGuardAccountActive, isGuardAccountApproved } from '../../lib/accountStatus';
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

/** Staff: approve on verified ID on file, activate on verified guard card on file. */
export function StaffGuardActivationChecklistView({ guard }: StaffGuardActivationChecklistViewProps) {
  const checklist = getGuardActivationChecklist(guard);
  const missingGrace = getGuardMissingGraceCredentialLabels(guard);
  const approved = isGuardAccountApproved(guard);
  const active = isGuardAccountActive(guard);
  const guardCardReady = guardMeetsLevel1(guard) && guardHasVerifiedGuardCard(guard);

  return (
    <div className="app-checklist-panel">
      <p className="text-sm font-semibold">Profile approval & activation (staff)</p>
      <p className="text-xs text-brand-text-muted leading-relaxed mt-1">
        ID must be fully on file (photos + details) and verified before profile approval. Guard card must be fully
        on file (document photo) and staff-verified before activation. PTA/UOF and 32-hour count if listed or on
        file — if not listed at all, staff sets a grace period when activating.
      </p>
      <div className="app-checklist-steps">
        <StepRow
          done={approved || active}
          label="1. Approve profile — government ID fully on file"
          detail={
            approved || active
              ? 'Profile approved'
              : guardHasVerifiedIdForWork(guard)
                ? 'ID verified — ready to approve'
                : checklist.idSubmitted
                  ? 'ID on file — review and approve below'
                  : 'ID not fully on file'
          }
        />
        <StepRow
          done={active}
          label="2. Activate account — BSIS Guard Card on file"
          detail={
            active
              ? 'Account active'
              : approved
                ? guardCardReady
                  ? missingGrace.length > 0
                    ? 'Guard card verified — optional creds not listed (set grace at activation)'
                    : 'Guard card verified — ready to fully activate'
                  : checklist.guardCardSubmitted
                    ? 'Guard card on file — staff verification required'
                    : checklist.staffActivationBlockers.find((b) => b.includes('listed'))
                      ? 'Guard card listed — document photo required'
                      : 'Guard card not on file yet'
                : 'Approve profile first'
          }
        />
      </div>

      {missingGrace.length > 0 && (approved || active) && (
        <div className="mt-3 pt-3 border-t border-brand-border space-y-2">
          <p className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            Not listed — grace required at activation
          </p>
          <div className="flex flex-wrap gap-1.5">
            {!guardMeetsPtaUofTrainingListed(guard) && <WfBadge tone="warning">PTA/UOF not listed</WfBadge>}
            {!guardMeets32HourBlockListed(guard) && (
              <WfBadge tone="warning">32-hour block not listed</WfBadge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
