import React from 'react';
import { SecurityGuard } from '../../types';
import { getGuardActivationChecklist } from '../../lib/guardAccountActivation';
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
        <WfBadge tone={checklist.idVerified ? 'success' : checklist.idSubmitted ? 'warning' : 'default'}>
          ID {checklist.idVerified ? 'verified' : checklist.idSubmitted ? 'pending' : 'needed'}
        </WfBadge>
        <WfBadge tone={checklist.guardCardVerified ? 'success' : checklist.guardCardSubmitted ? 'warning' : 'default'}>
          Guard card {checklist.guardCardVerified ? 'verified' : checklist.guardCardSubmitted ? 'pending' : 'needed'}
        </WfBadge>
        {checklist.canActivate && <WfBadge tone="primary">Ready to activate</WfBadge>}
      </div>
    );
  }

  return (
    <div className="app-checklist-panel">
      <p className="text-sm font-semibold">Account activation requirements</p>
      <p className="text-xs text-brand-text-muted leading-relaxed mt-1">
        Submit government ID and a BSIS Guard Card. Staff verifies both before activating your account.
      </p>
      <div className="app-checklist-steps">
        <StepRow
          done={checklist.idVerified}
          label="Government ID + identity selfie"
          detail={
            checklist.idVerified
              ? 'Verified by staff'
              : checklist.idSubmitted
                ? 'Submitted — awaiting staff review'
                : 'Upload in ID verification section'
          }
        />
        <StepRow
          done={checklist.guardCardVerified}
          label="BSIS Guard Card"
          detail={
            checklist.guardCardVerified
              ? 'Verified by staff'
              : checklist.guardCardSubmitted
                ? 'Uploaded — awaiting staff verification'
                : 'Upload under credentials in profile'
          }
        />
        <OptionalNote
          label="Add extra credentials (optional)"
          detail="Firearms permits, medical certs, FEMA, and more can be added in your profile anytime — not required for activation."
        />
      </div>
      {checklist.canActivate && (
        <p className="text-xs text-brand-primary font-medium pt-3 border-t border-brand-border mt-3">
          All requirements complete — staff can activate your account.
        </p>
      )}
    </div>
  );
}
