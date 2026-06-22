import React from 'react';
import { IdCard } from 'lucide-react';
import { SecurityGuard } from '../../types';
import {
  getGuardIdVerificationStatus,
  guardIdVerificationCanEdit,
  ID_VERIFICATION_POLICY_HINT,
  ID_VERIFICATION_STATUS_LABELS,
} from '../../lib/guardIdentityVerification';
import { getGuardUserStatus } from '../../lib/accountStatus';
import { WfBadge } from '../ui/wireframe';
import { GuardIdItemCard } from './GuardIdItemCard';

export interface GuardIdentityVerificationPayload {
  idState: string;
  idNumber: string;
  idExpiryDate: string;
  idFrontUrl: string;
  idBackUrl: string;
  idSelfieUrl: string;
}

export type IdentityVerificationSubmitResult = { ok: true } | { ok: false; error: string };

interface GuardIdentityVerificationPanelProps {
  guard: SecurityGuard;
  onSubmit: (payload: GuardIdentityVerificationPayload) => Promise<IdentityVerificationSubmitResult>;
  compact?: boolean;
  /** Staff can upload or replace ID photos regardless of guard lock state. */
  staffMode?: boolean;
  /** Render without outer section chrome — for use inside staff review. */
  embedded?: boolean;
}

export function GuardIdentityVerificationPanel({
  guard,
  onSubmit,
  compact = false,
  staffMode = false,
  embedded = false,
}: GuardIdentityVerificationPanelProps) {
  const status = getGuardIdVerificationStatus(guard);
  const applicationBlocked = getGuardUserStatus(guard) === 'blocked';
  const canEdit = staffMode ? !applicationBlocked : guardIdVerificationCanEdit(guard);
  const statusTone =
    status === 'verified' ? 'success' : status === 'pending' ? 'warning' : status === 'rejected' ? 'danger' : 'default';

  const body = (
    <>
      {!staffMode && !embedded && (
        <p className="text-xs text-brand-text-muted leading-relaxed">{ID_VERIFICATION_POLICY_HINT}</p>
      )}
      {staffMode && (
        <p className="text-sm text-brand-text-muted leading-relaxed">
          Tap the ID card to view details or edit state, number, expiration, and photos on behalf of the guard.
        </p>
      )}

      {!staffMode && status === 'rejected' && guard.idVerificationRejectionReason && (
        <p className="text-sm text-amber-500 border border-amber-500/30 rounded-lg px-3 py-2">
          Staff requested a resubmit — tap your ID card, then Edit to update. {guard.idVerificationRejectionReason}
        </p>
      )}

      {staffMode && status === 'rejected' && guard.idVerificationRejectionReason && (
        <p className="text-sm text-amber-500 border border-amber-500/30 rounded-lg px-3 py-2 leading-relaxed">
          Resubmit requested — approval on hold. {guard.idVerificationRejectionReason}
        </p>
      )}

      {!staffMode && status === 'pending' && (
        <p className="text-sm text-amber-400/90">
          Submitted {guard.idVerificationSubmittedAt ? new Date(guard.idVerificationSubmittedAt).toLocaleString() : ''} —
          Guardr staff will review your documents.
        </p>
      )}

      {status === 'verified' && guard.idVerificationReviewedAt && (
        <p className="text-sm text-emerald-400/90">
          Verified {new Date(guard.idVerificationReviewedAt).toLocaleString()}
        </p>
      )}

      <div className="app-cert-item-stack border-t border-brand-border pt-3">
        <GuardIdItemCard
          guard={guard}
          canEdit={canEdit}
          staffMode={staffMode}
          onSubmit={onSubmit}
        />
      </div>
    </>
  );

  if (embedded) {
    return <div className="space-y-4">{body}</div>;
  }

  return (
    <section className={`app-form-section space-y-3 ${compact ? '' : ''}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="uber-label flex items-center gap-2">
            <IdCard className="w-4 h-4 text-brand-primary" />
            Government ID
          </p>
          {!staffMode && (
            <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
              Required for account activation. Tap the card to view details — use Edit inside to update your ID.
            </p>
          )}
        </div>
        <WfBadge tone={statusTone}>{ID_VERIFICATION_STATUS_LABELS[status]}</WfBadge>
      </div>
      {body}
    </section>
  );
}
