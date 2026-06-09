import React from 'react';
import { SecurityGuard } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import {
  formatJobDate,
  formatJobTimeRange,
  getEstimatedGuardEarnings,
  getGuardHourlyPay,
} from '../../lib/guardJobs';
import { formatDuration } from '../../lib/dates';
import { GuardJobDetailContent } from './GuardJobDetailContent';

interface GuardJobCardProps {
  job: GuardJobView;
  guard: SecurityGuard;
  onAccept?: () => void;
  onSelect?: () => void;
  onClose?: () => void;
  compact?: boolean;
}

export function GuardJobCard({ job, guard, onAccept, onSelect, onClose, compact = false }: GuardJobCardProps) {
  const hourlyPay = getGuardHourlyPay(job);
  const estimated = getEstimatedGuardEarnings(job);

  if (compact) {
    return (
      <button
        type="button"
        onClick={onSelect}
        className="app-item-card app-item-card-align-top w-full flex-col !items-stretch gap-2 text-left"
      >
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <p className="font-semibold truncate">{job.title}</p>
            <p className="text-sm text-brand-text-muted mt-1">
              {job.clientName} · {formatJobDate(job)} · {formatJobTimeRange(job)}
            </p>
            <p className="text-sm text-brand-text-muted mt-0.5">
              ${hourlyPay}/hr · {formatDuration(job.durationHours)}
            </p>
          </div>
          <p className="text-lg font-bold text-brand-primary shrink-0">${estimated}</p>
        </div>
      </button>
    );
  }

  return (
    <GuardJobDetailContent
      job={job}
      guard={guard}
      onAccept={onAccept}
      onClose={onClose}
    />
  );
}
