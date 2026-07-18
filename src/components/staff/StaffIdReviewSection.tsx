import { showAppToast } from '../ui/AppToast';
import React, { useState } from 'react';
import { Check, RefreshCw, X } from 'lucide-react';
import { SecurityGuard } from '../../types';
import {
  getGuardIdVerificationStatus,
  guardIdVerificationResubmitPending,
  ID_VERIFICATION_SLOT_LABELS,
  staffApproveIdVerificationBlocker,
  staffCanApproveIdVerification,
  staffCanRequestIdResubmit,
} from '../../lib/guardIdentityVerification';
import {
  IdVerificationSlot,
  promptRejectGuardApplicationNote,
  promptStaffResubmitNote,
} from '../../lib/staffDocumentReview';
import { getGuardUserStatus } from '../../lib/accountStatus';
import { AppButton } from '../ui/AppButton';
import type { GuardIdentityVerificationPayload, IdentityVerificationSubmitResult } from '../profile/GuardIdentityVerificationPanel';

interface StaffIdReviewSectionProps {
  guard: SecurityGuard;
  canManage?: boolean;
  onApprove?: (guardId: string) => void | Promise<void>;
  onReject?: (guardId: string, reason?: string) => void | Promise<void>;
  approveActionLabel?: string;
  onRequestResubmit?: (guardId: string, slots: IdVerificationSlot[], staffNote?: string) => void | Promise<void>;
  onUpdateImages?: (payload: GuardIdentityVerificationPayload) => Promise<IdentityVerificationSubmitResult>;
}

/** Staff approve / resubmit actions for government ID — status is shown on the ID credential card. */
export function StaffIdReviewSection({
  guard,
  canManage = false,
  onApprove,
  onReject,
  approveActionLabel = 'Approve ID',
  onRequestResubmit,
}: StaffIdReviewSectionProps) {
  const status = getGuardIdVerificationStatus(guard);
  const applicationBlocked = getGuardUserStatus(guard) === 'blocked';
  const applicationVerifyBlocker = staffApproveIdVerificationBlocker(guard);
  const resubmitPending = guardIdVerificationResubmitPending(guard);
  const canApprove = staffCanApproveIdVerification(guard);
  const canRequestResubmit = staffCanRequestIdResubmit(guard);
  // Prevents a fast double-click from firing duplicate approve/reject writes.
  const [actionPending, setActionPending] = useState(false);

  if (!canManage) return null;
  if (status === 'not_submitted') return null;

  const requestSlot = (slot: IdVerificationSlot) => {
    if (!onRequestResubmit) return;
    void (async () => {
      const note = await promptStaffResubmitNote(ID_VERIFICATION_SLOT_LABELS[slot]);
      if (note === null) return;
      void onRequestResubmit(guard.id, [slot], note);
    })();
  };

  const requestAll = () => {
    if (!onRequestResubmit) return;
    void (async () => {
      const note = await promptStaffResubmitNote('ID front, ID back, and identity selfie');
      if (note === null) return;
      void onRequestResubmit(guard.id, ['front', 'back', 'selfie'], note);
    })();
  };

  return (
    <div className="space-y-3">
      {applicationVerifyBlocker && (
        <p className="text-xs text-amber-500 leading-relaxed border border-amber-500/30 bg-amber-500/10 rounded-lg px-3 py-2">
          {applicationVerifyBlocker}
        </p>
      )}
      {resubmitPending && guard.idVerificationRejectionReason && (
        <p className="text-sm text-amber-500 border border-amber-500/30 bg-amber-500/10 rounded-lg px-3 py-2 leading-relaxed">
          Awaiting guard resubmit — approval on hold. {guard.idVerificationRejectionReason}
        </p>
      )}
      <div className="app-action-row--equal">
        {canApprove && onApprove && (
          <AppButton
            variant="primary"
            size="sm"
            disabled={actionPending}
            onClick={() => {
              if (actionPending) return;
              setActionPending(true);
              void (async () => {
                try {
                  await onApprove(guard.id);
                } catch (err) {
                  showAppToast(err instanceof Error ? err.message : 'Could not approve ID.', { tone: 'error' });
                } finally {
                  setActionPending(false);
                }
              })();
            }}
            startEnhancer={<Check className="w-3.5 h-3.5" />}
          >
            {approveActionLabel}
          </AppButton>
        )}
        {onRequestResubmit && canRequestResubmit && (
          <>
            <AppButton variant="outline" size="sm" onClick={() => requestSlot('front')} startEnhancer={<RefreshCw className="w-3.5 h-3.5" />}>
              Resubmit ID front
            </AppButton>
            <AppButton variant="outline" size="sm" onClick={() => requestSlot('back')} startEnhancer={<RefreshCw className="w-3.5 h-3.5" />}>
              Resubmit ID back
            </AppButton>
            <AppButton variant="outline" size="sm" onClick={() => requestSlot('selfie')} startEnhancer={<RefreshCw className="w-3.5 h-3.5" />}>
              Resubmit selfie
            </AppButton>
            <AppButton
              variant="outline"
              size="sm"
              className="text-amber-500 border-amber-500/40"
              onClick={requestAll}
              startEnhancer={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Resubmit all ID photos
            </AppButton>
          </>
        )}
        {onReject && !applicationBlocked && status !== 'verified' && (
          <AppButton
            variant="danger"
            size="sm"
            disabled={actionPending}
            onClick={() => {
              if (actionPending) return;
              void (async () => {
                const reason = await promptRejectGuardApplicationNote();
                if (reason === null) return;
                setActionPending(true);
                try {
                  await onReject(guard.id, reason);
                } catch (err) {
                  showAppToast(err instanceof Error ? err.message : 'Could not reject application.', { tone: 'error' });
                } finally {
                  setActionPending(false);
                }
              })();
            }}
            startEnhancer={<X className="w-3.5 h-3.5" />}
          >
            Reject application
          </AppButton>
        )}
      </div>
    </div>
  );
}
