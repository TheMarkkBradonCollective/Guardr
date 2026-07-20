import React, { useEffect, useState } from 'react';
import { getShiftPeriodSnapshot } from '../../lib/shiftPeriod';
import { Clock, Hourglass } from 'lucide-react';

interface ShiftPeriodStatusBarProps {
  startDate: string;
  endDate: string;
  /** When true, emphasize time remaining in the shift window */
  live?: boolean;
}

export function ShiftPeriodStatusBar({ startDate, endDate, live = false }: ShiftPeriodStatusBarProps) {
  const [snapshot, setSnapshot] = useState(() => getShiftPeriodSnapshot(startDate, endDate));

  useEffect(() => {
    const tick = () => setSnapshot(getShiftPeriodSnapshot(startDate, endDate));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [startDate, endDate]);

  const primaryLabel = snapshot.startsInLabel
    ? `Starts in ${snapshot.startsInLabel}`
    : snapshot.remainingMs > 0
      ? `${snapshot.remainingLabel} left`
      : 'Job window ended';

  return (
    <div className="shift-period-status-bar border border-brand-border bg-brand-bg-sec px-3 py-2.5 space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-brand-text-muted min-w-0">
          <Clock className="w-3.5 h-3.5 shrink-0 text-brand-primary" />
          <span className="truncate">
            <span className="font-semibold text-brand-text">{snapshot.totalLabel}</span> scheduled
          </span>
        </div>
        <div
          className={`flex items-center gap-1.5 shrink-0 font-semibold ${
            live && snapshot.remainingMs > 0 ? 'text-brand-primary' : 'text-brand-text'
          }`}
        >
          <Hourglass className="w-3.5 h-3.5" />
          <span>{primaryLabel}</span>
        </div>
      </div>

      <div className="shift-period-progress-track h-1.5 bg-brand-border overflow-hidden">
        <div
          className="shift-period-progress-fill h-full bg-brand-primary transition-[width] duration-500"
          style={{ width: `${snapshot.progressPct}%` }}
        />
      </div>

      <div className="flex items-center justify-between gap-2 text-[10px] text-brand-text-muted">
        <span>{snapshot.elapsedLabel} elapsed</span>
        <span>Ends {snapshot.windowEndLabel}</span>
      </div>
    </div>
  );
}
