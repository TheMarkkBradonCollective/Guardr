import React, { useEffect, useState } from 'react';
import { SecurityGuard } from '../../types';
import {
  guardCredentialGraceMsRemaining,
  guardCredentialGraceNotice,
  guardGraceWaivesTrainingCredential,
} from '../../lib/guardCredentialGrace';
import type { GraceTrainingCredential } from '../../lib/guardCredentialGrace';
import { Clock, Hourglass } from 'lucide-react';

interface CredentialGracePeriodStatusBarProps {
  guard: SecurityGuard;
  kind: GraceTrainingCredential;
}

export function CredentialGracePeriodStatusBar({ guard, kind }: CredentialGracePeriodStatusBarProps) {
  const [remainingMs, setRemainingMs] = useState(() => guardCredentialGraceMsRemaining(guard));

  useEffect(() => {
    if (!guardGraceWaivesTrainingCredential(guard, kind)) return;
    const tick = () => setRemainingMs(guardCredentialGraceMsRemaining(guard));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [guard, kind]);

  if (!guardGraceWaivesTrainingCredential(guard, kind)) return null;

  const notice = guardCredentialGraceNotice(guard);
  if (!notice) return null;

  const totalMs = notice.periodHours * 60 * 60 * 1000;
  const elapsedMs = Math.max(0, totalMs - remainingMs);
  const progressPct = totalMs <= 0 ? 0 : Math.min(100, Math.round((elapsedMs / totalMs) * 100));

  return (
    <div className="shift-period-status-bar border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-brand-text-muted min-w-0">
          <Clock className="w-3.5 h-3.5 shrink-0 text-amber-500" />
          <span className="truncate">
            <span className="font-semibold text-brand-text">{notice.periodHours}h</span> grace period
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 font-semibold text-amber-600 dark:text-amber-400">
          <Hourglass className="w-3.5 h-3.5" />
          <span>{notice.timeRemainingLabel} left</span>
        </div>
      </div>
      <div className="shift-period-progress-track h-1.5 bg-brand-border overflow-hidden">
        <div
          className="shift-period-progress-fill h-full bg-amber-500 transition-[width] duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <p className="text-[10px] text-brand-text-muted">
        Upload required credentials before grace ends · {notice.elapsedLabel} elapsed
      </p>
    </div>
  );
}
