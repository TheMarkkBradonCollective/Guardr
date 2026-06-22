import React from 'react';
import { X } from 'lucide-react';
import { SecurityGuard } from '../../types';
import {
  getGuardIdVerificationStatus,
  ID_VERIFICATION_SLOT_LABELS,
  ID_VERIFICATION_STATUS_LABELS,
} from '../../lib/guardIdentityVerification';
import { formatStateName } from '../../lib/states';
import { AppModal } from '../ui/motion/AppMotion';
import { WfBadge } from '../ui/wireframe';
import { IdVerificationImageThumb } from './IdVerificationImageModal';

interface GuardIdDetailModalProps {
  guard: SecurityGuard;
  onClose: () => void;
  guardName?: string;
}

export function GuardIdDetailModal({ guard, onClose, guardName }: GuardIdDetailModalProps) {
  const status = getGuardIdVerificationStatus(guard);
  const statusTone =
    status === 'verified' ? 'success' : status === 'pending' ? 'warning' : status === 'rejected' ? 'danger' : 'default';

  return (
    <AppModal open onClose={onClose} ariaLabelledBy="guard-id-detail-title">
      <div className="flex items-start justify-between gap-3 p-5 border-b border-brand-border">
        <div className="min-w-0">
          {guardName && <p className="text-xs text-brand-text-muted mb-1">{guardName}</p>}
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted mb-1">
            Government ID
          </p>
          <h2 id="guard-id-detail-title" className="font-bold text-lg leading-snug">
            Identity verification
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 p-2 rounded-lg text-brand-text-muted hover:text-brand-text hover:bg-brand-border/20"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        <div className="flex flex-wrap gap-2">
          <WfBadge tone={statusTone}>{ID_VERIFICATION_STATUS_LABELS[status]}</WfBadge>
        </div>

        {status === 'rejected' && guard.idVerificationRejectionReason && (
          <p className="text-sm text-amber-500 border border-amber-500/30 bg-amber-500/10 rounded-lg px-3 py-2 leading-relaxed">
            {guard.idVerificationRejectionReason}
          </p>
        )}

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-brand-text-muted">Issuing state</dt>
            <dd className="font-medium mt-0.5">{guard.idState ? formatStateName(guard.idState) : '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-brand-text-muted">ID number</dt>
            <dd className="font-medium mt-0.5">{guard.idNumber ? `#${guard.idNumber}` : '—'}</dd>
          </div>
        </dl>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <IdVerificationImageThumb
            label={ID_VERIFICATION_SLOT_LABELS.front}
            imageUrl={guard.idFrontUrl}
            guardName={guardName}
          />
          <IdVerificationImageThumb
            label={ID_VERIFICATION_SLOT_LABELS.back}
            imageUrl={guard.idBackUrl}
            guardName={guardName}
          />
          <div className="sm:col-span-2">
            <IdVerificationImageThumb
              label={ID_VERIFICATION_SLOT_LABELS.selfie}
              imageUrl={guard.idSelfieUrl}
              guardName={guardName}
              imageClassName="w-full h-44 object-cover rounded-lg border border-brand-border bg-brand-bg-sec"
              emptyClassName="h-44 rounded-lg border border-dashed border-brand-border bg-brand-bg-sec flex items-center justify-center text-xs text-brand-text-muted px-2 text-center"
            />
          </div>
        </div>

        {guard.idVerificationSubmittedAt && (
          <p className="text-xs text-brand-text-muted">
            Submitted {new Date(guard.idVerificationSubmittedAt).toLocaleString()}
          </p>
        )}
        {status === 'verified' && guard.idVerificationReviewedAt && (
          <p className="text-xs text-emerald-400/90">
            Verified {new Date(guard.idVerificationReviewedAt).toLocaleString()}
          </p>
        )}
      </div>
    </AppModal>
  );
}
