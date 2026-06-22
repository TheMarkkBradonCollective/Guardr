import React from 'react';
import { Check, RefreshCw, X } from 'lucide-react';
import { SecurityGuard } from '../../types';
import {
  getGuardIdVerificationStatus,
  guardIdVerificationPhotosComplete,
  guardIdVerificationResubmitPending,
  ID_VERIFICATION_SLOT_LABELS,
  staffCanApproveIdVerification,
  staffCanRequestIdResubmit,
} from '../../lib/guardIdentityVerification';
import {
  IdVerificationSlot,
  promptRejectGuardApplicationNote,
  promptStaffResubmitNote,
} from '../../lib/staffDocumentReview';
import { getGuardUserStatus } from '../../lib/accountStatus';
import { IdVerificationImageThumb } from '../profile/IdVerificationImageModal';
import { WfSectionHeader } from '../ui/wireframe';

interface StaffIdReviewSectionProps {
  guard: SecurityGuard;
  onApprove?: (guardId: string) => void | Promise<void>;
  onReject?: (guardId: string, reason?: string) => void | Promise<void>;
  onRequestResubmit?: (guardId: string, slots: IdVerificationSlot[], staffNote?: string) => void | Promise<void>;
}

export function StaffIdReviewSection({
  guard,
  onApprove,
  onReject,
  onRequestResubmit,
}: StaffIdReviewSectionProps) {
  const status = getGuardIdVerificationStatus(guard);
  const hasPhotos = guardIdVerificationPhotosComplete(guard);
  const applicationBlocked = getGuardUserStatus(guard) === 'blocked';
  const resubmitPending = guardIdVerificationResubmitPending(guard);
  const canApprove = staffCanApproveIdVerification(guard);
  const canRequestResubmit = staffCanRequestIdResubmit(guard);

  if (!hasPhotos && status === 'not_submitted') {
    return null;
  }

  const requestSlot = (slot: IdVerificationSlot) => {
    if (!onRequestResubmit) return;
    const note = promptStaffResubmitNote(ID_VERIFICATION_SLOT_LABELS[slot]);
    if (note === null) return;
    void onRequestResubmit(guard.id, [slot], note);
  };

  const requestAll = () => {
    if (!onRequestResubmit) return;
    const note = promptStaffResubmitNote('ID front, ID back, and identity selfie');
    if (note === null) return;
    void onRequestResubmit(guard.id, ['front', 'back', 'selfie'], note);
  };

  return (
    <section className="py-4 border-b border-brand-border space-y-3">
      <WfSectionHeader title="ID verification review" className="mb-0" />
      {status !== 'not_submitted' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <IdVerificationImageThumb
            label={ID_VERIFICATION_SLOT_LABELS.front}
            imageUrl={guard.idFrontUrl}
            guardName={guard.name}
          />
          <IdVerificationImageThumb
            label={ID_VERIFICATION_SLOT_LABELS.back}
            imageUrl={guard.idBackUrl}
            guardName={guard.name}
          />
          <IdVerificationImageThumb
            label={ID_VERIFICATION_SLOT_LABELS.selfie}
            imageUrl={guard.idSelfieUrl}
            guardName={guard.name}
          />
        </div>
      )}
      <p className="text-xs text-brand-text-muted leading-relaxed">
        Request a resubmit when a photo is unclear — approval stays on hold until the guard re-uploads and
        staff can review again. Resubmit requests are not available after ID is approved. Use{' '}
        <strong className="text-brand-text">Reject application</strong> to deny the entire application; the
        account is blocked.
      </p>
      {resubmitPending && guard.idVerificationRejectionReason && (
        <p className="text-sm text-amber-500 border border-amber-500/30 bg-amber-500/10 rounded-lg px-3 py-2 leading-relaxed">
          Awaiting guard resubmit — approval on hold. {guard.idVerificationRejectionReason}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {canApprove && onApprove && (
          <button
            type="button"
            onClick={() => void onApprove(guard.id)}
            className="app-button-primary !w-auto !h-9 !px-4 !text-xs gap-1"
          >
            <Check className="w-3.5 h-3.5" /> Approve ID
          </button>
        )}
        {onRequestResubmit && canRequestResubmit && (
          <>
            <button
              type="button"
              onClick={() => requestSlot('front')}
              className="app-button-outline !w-auto !h-9 !px-4 !text-xs gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Resubmit ID front
            </button>
            <button
              type="button"
              onClick={() => requestSlot('back')}
              className="app-button-outline !w-auto !h-9 !px-4 !text-xs gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Resubmit ID back
            </button>
            <button
              type="button"
              onClick={() => requestSlot('selfie')}
              className="app-button-outline !w-auto !h-9 !px-4 !text-xs gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Resubmit selfie
            </button>
            <button
              type="button"
              onClick={requestAll}
              className="app-button-outline !w-auto !h-9 !px-4 !text-xs gap-1 text-amber-500 border-amber-500/40"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Resubmit all ID photos
            </button>
          </>
        )}
        {onReject && !applicationBlocked && status !== 'verified' && (
          <button
            type="button"
            onClick={() => {
              const reason = promptRejectGuardApplicationNote();
              if (reason === null) return;
              void onReject(guard.id, reason);
            }}
            className="app-button-outline !w-auto !h-9 !px-4 !text-xs text-red-400 border-red-500/40 gap-1"
          >
            <X className="w-3.5 h-3.5" /> Reject application
          </button>
        )}
      </div>
    </section>
  );
}
