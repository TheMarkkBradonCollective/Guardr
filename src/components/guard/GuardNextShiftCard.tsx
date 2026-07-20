import React, { useEffect, useState } from 'react';
import { ChevronRight, Clock } from 'lucide-react';
import type { GuardJobView } from '../../lib/guardJobView';
import { formatShiftRange } from '../../lib/dates';
import {
  formatShiftStartsInCountdown,
  isNextShiftCountdownActive,
} from '../../lib/guardNextShift';

interface GuardNextShiftCardProps {
  job: GuardJobView;
  onOpen: () => void;
}

/** Promoted next accepted shift on the map browse dock (empty or with open jobs). */
export function GuardNextShiftCard({ job, onOpen }: GuardNextShiftCardProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const countdownActive = isNextShiftCountdownActive(job.startDate, nowMs);

  useEffect(() => {
    if (!countdownActive) return;
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [countdownActive, job.startDate]);

  const location = job.siteName || job.address || job.location;
  const countdown = formatShiftStartsInCountdown(job.startDate, nowMs);
  const started = countdown === '00:00:00' && countdownActive;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`guard-next-shift-card${countdownActive ? ' guard-next-shift-card--flash' : ''}`}
    >
      <div className="guard-next-shift-card-top">
        <p className="guard-next-shift-eyebrow">Next Job</p>
        <ChevronRight className="w-4 h-4 shrink-0 opacity-60" aria-hidden />
      </div>
      <p className="guard-next-shift-title">{job.title}</p>
      <p className="guard-next-shift-meta">{location}</p>
      {countdownActive ? (
        <p className="guard-next-shift-countdown">
          <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden />
          <span>
            {started ? 'Job started — open for details' : `Starts in ${countdown}`}
          </span>
        </p>
      ) : (
        <p className="guard-next-shift-meta">{formatShiftRange(job.startDate, job.endDate)}</p>
      )}
      <p className="guard-next-shift-cta">
        {countdownActive ? 'See full details · start heading' : 'See job details'}
      </p>
    </button>
  );
}
