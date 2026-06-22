import React from 'react';
import { SecurityGuard } from '../../types';
import { getGuardActivationChecklist } from '../../lib/guardAccountActivation';
import {
  guardHasVerifiedIdForWork,
  guardMeetsLevel1,
  guardMeetsPtaUofTraining,
  PTA_UOF_UPLOAD_GUIDANCE,
} from '../../lib/guardQualification';
import { WfBadge } from '../ui/wireframe';
import { Check, Circle, Plus } from 'lucide-react';

interface GuardActivationChecklistProps {
  guard: SecurityGuard;
  compact?: boolean;
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

function OptionalNote({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex items-start gap-2 text-sm pt-3 mt-1 border-t border-brand-border">
      <Plus className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
      <div>
        <span className="text-brand-text">{label}</span>
        <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">{detail}</p>
      </div>
    </div>
  );
}

export function GuardActivationChecklistView({ guard, compact = false }: GuardActivationChecklistProps) {
  const checklist = getGuardActivationChecklist(guard);

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        <WfBadge tone={checklist.idSubmitted ? 'success' : 'default'}>
          ID {checklist.idSubmitted ? 'on file' : 'needed'}
        </WfBadge>
        <WfBadge tone={checklist.guardCardVerified ? 'success' : checklist.guardCardSubmitted ? 'warning' : 'default'}>
          Guard card {checklist.guardCardVerified ? 'verified' : checklist.guardCardSubmitted ? 'pending' : 'needed'}
        </WfBadge>
        <WfBadge tone={guardMeetsPtaUofTraining(guard) ? 'success' : 'default'}>
          PTA/UOF {guardMeetsPtaUofTraining(guard) ? 'on file' : 'needed'}
        </WfBadge>
        {checklist.canActivate && <WfBadge tone="primary">Ready to approve</WfBadge>}
      </div>
    );
  }

  return (
    <div className="app-checklist-panel">
      <p className="text-sm font-semibold">Required to work</p>
      <p className="text-xs text-brand-text-muted leading-relaxed mt-1">
        Verified government ID, valid BSIS Guard Card, and 8-hour PTA/UOF training must be on file before staff can
        approve your profile.
      </p>
      <div className="app-checklist-steps">
        <StepRow
          done={guardHasVerifiedIdForWork(guard)}
          label="Government ID (verified)"
          detail={
            checklist.idVerified
              ? guardHasVerifiedIdForWork(guard)
                ? 'Verified by staff — tap Government ID in Credentials to view'
                : 'Verified but expired — update in Credentials'
              : checklist.idSubmitted
                ? 'Submitted — awaiting staff verification'
                : 'Upload in Credentials — tap Government ID'
          }
        />
        <StepRow
          done={guardMeetsLevel1(guard)}
          label="BSIS Guard Card (valid)"
          detail={
            guardMeetsLevel1(guard)
              ? 'Valid guard card on file'
              : checklist.guardCardSubmitted
                ? 'On file — must be current and valid to work'
                : 'Upload in the Guard Card section of your profile'
          }
        />
        <StepRow
          done={guardMeetsPtaUofTraining(guard)}
          label="Power to Arrest & Appropriate Use of Force (8 hr)"
          detail={
            guardMeetsPtaUofTraining(guard)
              ? 'PTA/UOF training on file'
              : `Upload in Credentials — ${PTA_UOF_UPLOAD_GUIDANCE}`
          }
        />
        <OptionalNote
          label="Add extra credentials (optional)"
          detail="Firearms permits, medical certs, FEMA, and more can be added in your profile anytime — not required for profile approval."
        />
      </div>
      {checklist.canActivate && (
        <p className="text-xs text-brand-primary font-medium pt-3 border-t border-brand-border mt-3">
          All required-to-work items complete — staff can approve your profile.
        </p>
      )}
    </div>
  );
}
