import React, { useState } from 'react';
import { SecurityRequest } from '../../types';
import { SelfAuditPhotoGallery } from '../jobs/SelfAuditPhotoGallery';
import {
  canClientConfirmSelfAudit,
  isSelfAuditClientConfirmed,
  missingSelfAuditPhotoKinds,
  SELF_AUDIT_PHOTO_LABELS,
} from '../../lib/selfAuditPhotos';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface ClientSelfAuditConfirmProps {
  request: SecurityRequest;
  onConfirm: (requestId: string) => void | Promise<void>;
}

export function ClientSelfAuditConfirm({ request, onConfirm }: ClientSelfAuditConfirmProps) {
  const audit = request.checkInAudit;
  const [confirming, setConfirming] = useState(false);

  if (!audit?.selfieUpload || !['in-progress', 'completed'].includes(request.status)) {
    return null;
  }

  const confirmed = isSelfAuditClientConfirmed(audit);
  const missing = missingSelfAuditPhotoKinds(audit);
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
        <p className="text-xs text-brand-text-muted mt-1">
          Review the guard&apos;s appearance photos before or during coverage.
        </p>
        {audit.staffUploadedBy && (
          <p className="text-xs text-brand-text-muted mt-1">
            Some photos were uploaded by staff ({audit.staffUploadedBy}).
          </p>
        )}
      </div>

      <SelfAuditPhotoGallery audit={audit} />

      {!confirmed && missing.length > 0 && (
        <p className="text-xs text-amber-400/90">
          Still waiting on: {missing.map((k) => SELF_AUDIT_PHOTO_LABELS[k]).join(', ')}.
        </p>
      )}

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
          className="app-button-primary !h-9 !text-xs w-full gap-1.5"
        >
          {confirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
          Confirm self-audit photos
        </button>
      ) : null}
    </div>
  );
}
