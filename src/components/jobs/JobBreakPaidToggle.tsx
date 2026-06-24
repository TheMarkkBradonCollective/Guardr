import React from 'react';

interface JobBreakPaidToggleProps {
  breakMinutes: number;
  breakPaid: boolean;
  onBreakPaidChange: (paid: boolean) => void;
  className?: string;
}

/** Shown when scheduled break minutes &gt; 0 — unpaid breaks reduce client billable hours. */
export function JobBreakPaidToggle({
  breakMinutes,
  breakPaid,
  onBreakPaidChange,
  className = '',
}: JobBreakPaidToggleProps) {
  if (breakMinutes <= 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <p className="text-xs text-brand-text-muted leading-relaxed">
        Break time can be paid (included in billing) or unpaid (deducted from billable hours when taken).
      </p>
      <div className="segmented-control segmented-control-full">
        <button
          type="button"
          onClick={() => onBreakPaidChange(true)}
          className={`segmented-control-btn flex-1 py-2.5 text-sm ${
            breakPaid ? 'segmented-control-btn-active' : ''
          }`}
        >
          Paid break
        </button>
        <button
          type="button"
          onClick={() => onBreakPaidChange(false)}
          className={`segmented-control-btn flex-1 py-2.5 text-sm ${
            !breakPaid ? 'segmented-control-btn-active' : ''
          }`}
        >
          Unpaid break
        </button>
      </div>
    </div>
  );
}
