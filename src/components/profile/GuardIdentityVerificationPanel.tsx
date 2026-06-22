import React from 'react';
import { IdCard } from 'lucide-react';
import { SecurityGuard } from '../../types';
import {
  guardIdVerificationCanEdit,
  ID_VERIFICATION_POLICY_HINT,
} from '../../lib/guardIdentityVerification';
import { getGuardUserStatus } from '../../lib/accountStatus';
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
  const applicationBlocked = getGuardUserStatus(guard) === 'blocked';
  const canEdit = staffMode ? !applicationBlocked : guardIdVerificationCanEdit(guard);

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

      {guard.idVerificationRejectionReason && (
        <p className="text-sm text-amber-500 border border-amber-500/30 rounded-lg px-3 py-2 leading-relaxed">
          {staffMode ? 'Resubmit requested — approval on hold. ' : 'Staff requested a resubmit — tap your ID card, then Edit to update. '}
          {guard.idVerificationRejectionReason}
        </p>
      )}

      <div className="app-cert-item-stack">
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
      {!staffMode && (
        <div>
          <p className="uber-label flex items-center gap-2">
            <IdCard className="w-4 h-4 text-brand-primary" />
            Government ID
          </p>
          <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
            Required for account activation. Tap the card to view details — use Edit inside to update your ID.
          </p>
        </div>
      )}
      {body}
    </section>
  );
}
