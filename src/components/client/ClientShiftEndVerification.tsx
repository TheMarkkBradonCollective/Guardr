import React, { useState } from 'react';
import { AlertTriangle, Check, CheckCircle2, Clock, Flag, Loader2, MapPin } from 'lucide-react';
import type { SecurityRequest } from '../../types';
import {
  END_CHECKPOINT_FLAG_REASONS,
  flagReasonLabel,
} from '../../lib/shiftAuditViolations';
import {
  canClientFlagEndCheckpoint,
  canClientReviewEndCheckpoint,
  canClientVerifyEndCheckpoint,
  isEndCheckpointReviewExpired,
  summarizeEndCheckpointSkips,
} from '../../lib/shiftCheckpointReview';
import { isEndSelfAuditClientConfirmed } from '../../lib/selfAuditPhotos';

interface ClientShiftEndVerificationProps {
  request: SecurityRequest;
  onVerify: (requestId: string) => void | Promise<void>;
  onFlag: (requestId: string, category: string, note: string) => void | Promise<void>;
}

export function ClientShiftEndVerification({
  request,
  onVerify,
  onFlag,
}: ClientShiftEndVerificationProps) {
  const audit = request.checkOutAudit;
  const [verifying, setVerifying] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [flagCategory, setFlagCategory] = useState(END_CHECKPOINT_FLAG_REASONS[0].value);
  const [flagNote, setFlagNote] = useState('');

  if (!audit?.checkedAt || !['completed', 'closed'].includes(request.status)) {
    return null;
  }

  const expired = isEndCheckpointReviewExpired(request);
  const canReview = canClientReviewEndCheckpoint(request);
  const confirmed = isEndSelfAuditClientConfirmed(audit);
  const canVerify = canClientVerifyEndCheckpoint(request);
  const canFlag = canClientFlagEndCheckpoint(request);
  const skips = summarizeEndCheckpointSkips(request);

  const handleVerify = async () => {
    setVerifying(true);
    try {
      await onVerify(request.id);
    } finally {
      setVerifying(false);
    }
  };

  const handleFlag = async () => {
    if (!flagNote.trim()) return;
    setFlagging(true);
    try {
      await onFlag(request.id, flagCategory, flagNote.trim());
      setShowFlagForm(false);
      setFlagNote('');
    } finally {
      setFlagging(false);
    }
  };

  return (
    <div className="client-checkpoint-card border border-brand-border rounded-2xl p-4 space-y-3 w-full">
      <div>
        <p className="text-sm font-semibold text-brand-primary">End of shift verification</p>
        <p className="text-xs text-brand-text-muted mt-0.5">
          Verify or flag the guard&apos;s end-of-shift package within 48 hours.
        </p>
      </div>

      {expired && !confirmed && (
        <p className="text-xs text-brand-text-muted flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Review window closed — unreviewed (no violation recorded).
        </p>
      )}

      {skips.labels.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 space-y-1">
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Automatic issues recorded
          </p>
          <ul className="text-xs text-amber-900/90 dark:text-amber-100/90 list-disc pl-4 space-y-0.5">
            {skips.labels.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
      )}

      {audit.endSelfie ? (
        <div>
          <p className="uber-label mb-2">End self-audit</p>
          <img
            src={audit.endSelfie}
            alt="End of shift selfie"
            className="w-full h-32 object-cover rounded-xl border border-brand-border"
          />
        </div>
      ) : (
        <p className="text-xs text-amber-700 dark:text-amber-300">No end self-audit photo</p>
      )}

      {audit.locationPhoto ? (
        <div>
          <p className="uber-label mb-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Location photo
          </p>
          <img
            src={audit.locationPhoto}
            alt="Site at clock-out"
            className="w-full h-32 object-cover rounded-xl border border-brand-border"
          />
        </div>
      ) : (
        <p className="text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          No end location photo
        </p>
      )}

      {audit.dailyActivityReport && (
        <div className="rounded-xl border border-brand-border bg-brand-bg-sec/40 p-3">
          <p className="text-xs font-semibold mb-1">End-of-shift report</p>
          <p className="text-xs text-brand-text-muted whitespace-pre-wrap">{audit.dailyActivityReport}</p>
        </div>
      )}

      {confirmed ? (
        <p className="text-xs text-emerald-400/90 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Verified {audit.clientConfirmedAt ? new Date(audit.clientConfirmedAt).toLocaleString() : ''}
          {audit.clientConfirmedBy ? ` by ${audit.clientConfirmedBy}` : ''}
        </p>
      ) : canReview ? (
        <div className="space-y-2">
          {canVerify && !showFlagForm && (
            <button
              type="button"
              onClick={() => void handleVerify()}
              disabled={verifying}
              className="app-button-primary app-btn-sm w-full gap-1.5"
            >
              {verifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Verify end of shift
            </button>
          )}
          {canFlag && !showFlagForm && (
            <button
              type="button"
              onClick={() => setShowFlagForm(true)}
              className="app-button-outline app-btn-sm w-full gap-1.5 border-amber-500/40 text-amber-800 dark:text-amber-300"
            >
              <Flag className="w-3.5 h-3.5" />
              Flag issue
            </button>
          )}
          {showFlagForm && (
            <div className="space-y-2 rounded-xl border border-brand-border p-3 bg-brand-bg-sec/50">
              <label className="block text-xs font-semibold">Reason</label>
              <select
                value={flagCategory}
                onChange={(e) => setFlagCategory(e.target.value)}
                className="app-input w-full text-sm"
              >
                {END_CHECKPOINT_FLAG_REASONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <label className="block text-xs font-semibold">Details (required)</label>
              <textarea
                value={flagNote}
                onChange={(e) => setFlagNote(e.target.value)}
                rows={3}
                className="app-input w-full text-sm"
                placeholder={`Describe the ${flagReasonLabel('end', flagCategory).toLowerCase()}...`}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowFlagForm(false)}
                  className="app-button-outline app-btn-sm flex-1"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleFlag()}
                  disabled={flagging || !flagNote.trim()}
                  className="app-button-primary app-btn-sm flex-1 gap-1.5"
                >
                  {flagging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Flag className="w-3.5 h-3.5" />}
                  Submit flag
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
