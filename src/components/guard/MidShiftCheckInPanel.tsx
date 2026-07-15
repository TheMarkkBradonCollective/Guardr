import React, { useState } from 'react';
import { Clock, Loader2 } from 'lucide-react';
import { SlideToConfirm } from '../ui/SlideToConfirm';

interface MidShiftCheckInPanelProps {
  lastCheckInAt?: string;
  onSubmit: (payload: {
    selfie: string;
    uniformVerified: boolean;
    equipmentVerified: boolean;
  }) => void | Promise<void>;
  captureSelfie: () => Promise<string | null>;
}

const CHECK_IN_INTERVAL_MS = 60 * 60 * 1000;
const CHECK_IN_OPEN_EARLY_MS = 5 * 60 * 1000;

export function midShiftCheckInDue(
  shiftStartedAt: string | undefined,
  midShiftAudits: Array<{ checkedAt: string }> | undefined,
  now = Date.now()
): boolean {
  if (!shiftStartedAt) return false;
  const startMs = new Date(shiftStartedAt).getTime();
  if (Number.isNaN(startMs)) return false;

  const last = midShiftAudits?.[midShiftAudits.length - 1]?.checkedAt;
  const anchorMs = last ? new Date(last).getTime() : startMs;
  if (Number.isNaN(anchorMs)) return false;

  return now >= anchorMs + CHECK_IN_INTERVAL_MS - CHECK_IN_OPEN_EARLY_MS;
}

export function MidShiftCheckInPanel({
  lastCheckInAt,
  onSubmit,
  captureSelfie,
}: MidShiftCheckInPanelProps) {
  const [submitting, setSubmitting] = useState(false);
  const [uniformVerified, setUniformVerified] = useState(true);
  const [equipmentVerified, setEquipmentVerified] = useState(true);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const selfie = await captureSelfie();
      if (!selfie) return;
      await onSubmit({ selfie, uniformVerified, equipmentVerified });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold">Hourly check-in due</p>
          <p className="text-xs text-brand-text-muted mt-0.5">
            Confirm you are on post with a quick selfie check-in.
            {lastCheckInAt
              ? ` Last check-in ${new Date(lastCheckInAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}.`
              : ''}
          </p>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={uniformVerified}
          onChange={(e) => setUniformVerified(e.target.checked)}
        />
        Uniform compliant
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={equipmentVerified}
          onChange={(e) => setEquipmentVerified(e.target.checked)}
        />
        Equipment present
      </label>
      {submitting ? (
        <div className="flex items-center justify-center gap-2 py-3 text-sm text-brand-text-muted">
          <Loader2 className="w-4 h-4 animate-spin" />
          Capturing check-in…
        </div>
      ) : (
        <SlideToConfirm
          label="Slide to check in"
          confirmedLabel="Submitting…"
          onConfirm={() => void handleSubmit()}
        />
      )}
    </div>
  );
}
