import React, { useState } from 'react';
import { SecurityRequest } from '../../types';
import { NoSpotCheckBadge } from '../jobs/NoSpotCheckBadge';
import {
  canClientConfirmSpotCheck,
  hasSpotChecks,
  hasSpotChecksForClientReview,
  isNoSpotCheckFlagged,
  isSpotCheckClientConfirmed,
  sortedSpotChecks,
} from '../../lib/spotChecks';
import { CheckCircle2, Loader2, MapPin } from 'lucide-react';

interface ClientSpotCheckConfirmProps {
  request: SecurityRequest;
  onConfirm: (requestId: string, spotCheckId: string) => void | Promise<void>;
}

export function ClientSpotCheckConfirm({ request, onConfirm }: ClientSpotCheckConfirmProps) {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  if (!hasSpotChecksForClientReview(request)) {
    return null;
  }

  const flagged = isNoSpotCheckFlagged(request);
  const checks = sortedSpotChecks(request);

  if (flagged && !hasSpotChecks(request)) {
    return (
      <div className="border-t border-brand-border pt-4 space-y-2 w-full">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-brand-primary">Staff spot check</p>
          <NoSpotCheckBadge />
        </div>
        <p className="text-xs text-brand-text-muted">
          Guardr staff has not uploaded a presence photo for this job yet. You will be able to review and confirm once a spot check is on file.
        </p>
      </div>
    );
  }

  if (checks.length === 0) {
    return null;
  }

  const handleConfirm = async (spotCheckId: string) => {
    setConfirmingId(spotCheckId);
    try {
      await onConfirm(request.id, spotCheckId);
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="border-t border-brand-border pt-4 space-y-3 w-full">
      <div className="flex items-start gap-2">
        <MapPin className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-brand-primary">Staff spot checks</p>
          <p className="text-xs text-brand-text-muted mt-1">
            Review photos staff uploaded to confirm your guard is on site.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {checks.map((check) => {
          const confirmed = isSpotCheckClientConfirmed(check);
          const canConfirm = canClientConfirmSpotCheck(request, check.id);
          return (
            <div key={check.id} className="rounded-xl border border-brand-border p-3 space-y-2">
              <img
                src={check.imageUrl}
                alt="Staff spot check"
                className="w-full max-h-48 object-cover rounded-lg border border-brand-border"
              />
              <p className="text-[11px] text-brand-text-muted">
                Uploaded {new Date(check.uploadedAt).toLocaleString()}
              </p>
              {confirmed ? (
                <p className="text-xs text-emerald-400/90 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Confirmed {check.clientConfirmedAt ? new Date(check.clientConfirmedAt).toLocaleString() : ''}
                  {check.clientConfirmedBy ? ` by ${check.clientConfirmedBy}` : ''}
                </p>
              ) : canConfirm ? (
                <button
                  type="button"
                  onClick={() => void handleConfirm(check.id)}
                  disabled={confirmingId === check.id}
                  className="app-button-primary app-btn-sm w-full gap-1.5"
                >
                  {confirmingId === check.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  Confirm spot check
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
