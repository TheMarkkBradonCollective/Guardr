import React, { useEffect, useMemo, useState } from 'react';
import { toDatetimeLocal } from '../../lib/dates';
import { AppModal } from '../ui/motion/AppMotion';

interface LateClockOutPromptProps {
  open: boolean;
  endDate: string;
  checkInAt?: string;
  onClose: () => void;
  onConfirm: (checkedAt: string, leftEarlier: boolean) => void;
}

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function LateClockOutPrompt({
  open,
  endDate,
  checkInAt,
  onClose,
  onConfirm,
}: LateClockOutPromptProps) {
  const [step, setStep] = useState<'choice' | 'adjust'>('choice');
  const nowLocal = useMemo(() => toDatetimeLocal(new Date()), [open]);
  const [adjustedLocal, setAdjustedLocal] = useState(() => toDatetimeLocal(endDate));

  const minLocal = checkInAt ? toDatetimeLocal(checkInAt) : toDatetimeLocal(endDate);
  const maxLocal = nowLocal;

  useEffect(() => {
    if (!open) {
      setStep('choice');
      return;
    }
    const defaultLocal = toDatetimeLocal(endDate);
    setAdjustedLocal(defaultLocal > maxLocal ? maxLocal : defaultLocal < minLocal ? minLocal : defaultLocal);
  }, [open, endDate, minLocal, maxLocal]);

  const handleLeavingNow = () => {
    onConfirm(new Date().toISOString(), false);
  };

  const handleUseAdjustedTime = () => {
    const picked = new Date(adjustedLocal);
    if (Number.isNaN(picked.getTime())) return;
    const minMs = new Date(minLocal).getTime();
    const maxMs = new Date(maxLocal).getTime();
    const clampedMs = Math.min(maxMs, Math.max(minMs, picked.getTime()));
    onConfirm(new Date(clampedMs).toISOString(), true);
  };

  return (
    <AppModal
      open={open}
      align="center"
      position="absolute"
      zIndex={1004}
      onClose={onClose}
      panelClassName="p-6 space-y-4 max-w-md w-full"
    >
      {step === 'choice' ? (
        <>
          <h3 className="font-bold text-lg">You&apos;re clocking out late</h3>
          <p className="text-sm text-brand-text-muted leading-relaxed">
            Your shift was scheduled to end at {formatWhen(endDate)}. Are you leaving the site right now,
            or did you already head out and forget to clock out?
          </p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleLeavingNow}
              className="app-button-primary app-btn-md w-full"
            >
              I&apos;m leaving now
            </button>
            <button
              type="button"
              onClick={() => setStep('adjust')}
              className="app-button-outline app-btn-md w-full"
            >
              I left earlier — set my departure time
            </button>
            <button type="button" onClick={onClose} className="app-button-outline app-btn-md w-full">
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          <h3 className="font-bold text-lg">When did you leave?</h3>
          <p className="text-sm text-brand-text-muted leading-relaxed">
            Pick the time you actually left the site. Overtime billing, if any, will use this time.
          </p>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-brand-text-muted">Departure time</span>
            <input
              type="datetime-local"
              value={adjustedLocal}
              min={minLocal}
              max={maxLocal}
              onChange={(e) => setAdjustedLocal(e.target.value)}
              className="uber-input w-full"
            />
          </label>
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleUseAdjustedTime}
              className="app-button-primary app-btn-md w-full"
            >
              Use this time
            </button>
            <button
              type="button"
              onClick={() => setStep('choice')}
              className="app-button-outline app-btn-md w-full"
            >
              Back
            </button>
          </div>
        </>
      )}
    </AppModal>
  );
}
