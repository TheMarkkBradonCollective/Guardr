import React, { useEffect, useMemo, useState } from 'react';
import { toDatetimeLocal } from '../../lib/dates';
import { computeLateClockOutHours } from '../../lib/shiftBilling';
import { AppModal } from '../ui/motion/AppMotion';

export interface LateClockOutResult {
  checkedAt: string;
  leftEarlier: boolean;
  overtimeClaimed: boolean;
}

interface LateClockOutPromptProps {
  open: boolean;
  endDate: string;
  checkInAt?: string;
  onClose: () => void;
  onConfirm: (result: LateClockOutResult) => void;
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
  const endLocal = toDatetimeLocal(endDate);

  useEffect(() => {
    if (!open) {
      setStep('choice');
      return;
    }
    const defaultLocal = toDatetimeLocal(endDate);
    setAdjustedLocal(defaultLocal > maxLocal ? maxLocal : defaultLocal < minLocal ? minLocal : defaultLocal);
  }, [open, endDate, minLocal, maxLocal]);

  const handleStayed = () => {
    const checkedAt = new Date().toISOString();
    onConfirm({
      checkedAt,
      leftEarlier: false,
      overtimeClaimed: computeLateClockOutHours(checkedAt, endDate) > 0,
    });
  };

  const handleLeftOnTime = () => {
    onConfirm({
      checkedAt: endDate,
      leftEarlier: true,
      overtimeClaimed: false,
    });
  };

  const handleUseAdjustedTime = () => {
    const picked = new Date(adjustedLocal);
    if (Number.isNaN(picked.getTime())) return;
    const minMs = new Date(minLocal).getTime();
    const maxMs = new Date(maxLocal).getTime();
    const clampedMs = Math.min(maxMs, Math.max(minMs, picked.getTime()));
    const checkedAt = new Date(clampedMs).toISOString();
    onConfirm({
      checkedAt,
      leftEarlier: true,
      overtimeClaimed: clampedMs > new Date(endDate).getTime(),
    });
  };

  const adjustedHasOvertime =
    adjustedLocal > endLocal && adjustedLocal <= maxLocal && adjustedLocal >= minLocal;

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
          <h3 className="font-bold text-lg">Past your scheduled end</h3>
          <p className="text-sm text-brand-text-muted leading-relaxed">
            Your shift was scheduled to end at {formatWhen(endDate)}. Tell us how to record your
            departure — overtime only applies if you stayed past that time or set a later leave time.
          </p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleStayed}
              className="app-button-primary app-btn-md w-full"
            >
              I stayed — clock out now
            </button>
            <button
              type="button"
              onClick={() => setStep('adjust')}
              className="app-button-outline app-btn-md w-full"
            >
              Set when I left
            </button>
            <button
              type="button"
              onClick={handleLeftOnTime}
              className="app-button-outline app-btn-md w-full"
            >
              I left at scheduled end — forgot to clock out
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
            Pick the time you actually left the site. If it is after {formatWhen(endDate)}, the client
            will need to approve overtime before billing.
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
          {adjustedHasOvertime && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              This time is after your scheduled end — client approval will be required for overtime.
            </p>
          )}
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
