import React from 'react';
import { IdCard } from 'lucide-react';
import { SecurityGuard } from '../../types';
import {
  guardIdVerificationCanEdit,
  ID_VERIFICATION_POLICY_HINT,
} from '../../lib/guardIdentityVerification';
import { staffCanEditGuardGovernmentId } from '../../lib/staffCredentialRules';
import { getGuardUserStatus } from '../../lib/accountStatus';
import { GuardIdItemCard } from './GuardIdItemCard';

import type { GovernmentIdDocumentType } from '../../types';

export interface GuardIdentityVerificationPayload {
  idDocumentType: GovernmentIdDocumentType;
  idLicenseClass?: string;
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
  /** Staff may edit existing pending ID details; never submit a new ID for the guard. */
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
  const canEdit = applicationBlocked
    ? false
    : staffMode
      ? staffCanEditGuardGovernmentId(guard)
      : guardIdVerificationCanEdit(guard);

  const body = (
    <>

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
        </div>
      )}
      {body}
    </section>
  );
}
