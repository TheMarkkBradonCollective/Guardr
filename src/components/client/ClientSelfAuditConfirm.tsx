import React, { useState } from 'react';
import { SecurityRequest } from '../../types';
import { SelfAuditPhotoGallery } from '../jobs/SelfAuditPhotoGallery';
import { NoSelfAuditBadge } from '../jobs/NoSelfAuditBadge';
import {
  canClientConfirmSelfAudit,
  hasSelfAuditPhotosToReview,
  isNoSelfAuditFlagged,
  isSelfAuditClientConfirmed,
} from '../../lib/selfAuditPhotos';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface ClientSelfAuditConfirmProps {
  request: SecurityRequest;
  onConfirm: (requestId: string) => void | Promise<void>;
}

export function ClientSelfAuditConfirm({ request, onConfirm }: ClientSelfAuditConfirmProps) {
  const audit = request.checkInAudit;
  const [confirming, setConfirming] = useState(false);
  const flagged = isNoSelfAuditFlagged(request);
  const canReview = hasSelfAuditPhotosToReview(request);

  if (!audit || !['in-progress', 'completed'].includes(request.status)) {
    return null;
  }

  if (flagged && !canReview) {
    return (
      <div className="border-t border-brand-border pt-4 space-y-2 w-full">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-brand-primary">Guard self-audit</p>
          <NoSelfAuditBadge />
        </div>
      </div>
    );
  }

  if (!canReview && !isSelfAuditClientConfirmed(audit)) {
    return null;
  }

  const confirmed = isSelfAuditClientConfirmed(audit);
  const canConfirm = canClientConfirmSelfAudit(request);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      await onConfirm(request.id);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="border-t border-brand-border pt-4 space-y-3 w-full">
      <div>
        <p className="text-sm font-semibold text-brand-primary">Guard self-audit photos</p>
      </div>

      <SelfAuditPhotoGallery audit={audit} />

      {confirmed ? (
        <p className="text-xs text-emerald-400/90 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Confirmed {audit.clientConfirmedAt ? new Date(audit.clientConfirmedAt).toLocaleString() : ''}
          {audit.clientConfirmedBy ? ` by ${audit.clientConfirmedBy}` : ''}
        </p>
      ) : canConfirm ? (
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={confirming}
          className="app-button-primary app-btn-sm w-full gap-1.5"
        >
          {confirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          Confirm self-audit photos
        </button>
      ) : null}
    </div>
  );
}
