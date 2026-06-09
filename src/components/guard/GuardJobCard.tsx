import React from 'react';
import { SecurityGuard } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import {
  checkJobRequirements,
  formatJobDate,
  formatJobTimeRange,
  getEstimatedGuardEarnings,
  getGuardHourlyPay,
  getJobDistance,
} from '../../lib/guardJobs';
import { JobBillingSummaryFromGuardJob } from '../jobs/JobBillingSummary';
import { formatDuration } from '../../lib/dates';
import { formatStateName } from '../../lib/states';
import { MapPin, Star, Clock, Check, X } from 'lucide-react';

interface GuardJobCardProps {
  job: GuardJobView;
  guard: SecurityGuard;
  onAccept?: () => void;
  onSelect?: () => void;
  onClose?: () => void;
  compact?: boolean;
}

export function GuardJobCard({ job, guard, onAccept, onSelect, onClose, compact = false }: GuardJobCardProps) {
  const distance = getJobDistance(job);
  const hourlyPay = getGuardHourlyPay(job);
  const estimated = getEstimatedGuardEarnings(job);
  const { checks, canAccept } = checkJobRequirements(guard, job);

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
              {formatJobDate(job)} · {formatJobTimeRange(job)}
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

  const isUpcoming = job.status === 'accepted';
  const isDirectRequest = job.requestType === 'direct';

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {isUpcoming && (
            <span className="inline-block text-xs font-semibold text-brand-primary bg-brand-primary/15 px-2.5 py-1 rounded-full mb-2">
              Upcoming shift
            </span>
          )}
          {isDirectRequest && job.status === 'open' && (
            <span className="inline-block text-xs font-semibold text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-full mb-2 ml-0">
              Client sent you this assignment
            </span>
          )}
          <h3 className="text-xl font-bold tracking-tight leading-tight">{job.title}</h3>
          <p className="flex items-center gap-1.5 text-sm text-brand-text-muted mt-2">
            <MapPin className="w-4 h-4 text-brand-primary shrink-0" />
            {job.state ? `${formatStateName(job.state)} · ` : ''}{distance} mi away
          </p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} className="text-brand-text-muted hover:text-brand-text p-1 text-lg" aria-label="Close">
            ×
          </button>
        )}
      </div>

      <div className="space-y-3 border-t border-brand-border pt-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-brand-text-muted">{formatJobDate(job)}</span>
          <span className="font-semibold">{formatJobTimeRange(job)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-brand-text-muted">
          <Clock className="w-4 h-4" />
          {formatDuration(job.durationHours)}
        </div>
        <JobBillingSummaryFromGuardJob job={job} />
      </div>

      {job.clientRating != null && (
        <div className="flex items-center gap-2 text-sm text-brand-text-muted">
          <Star className="w-4 h-4 fill-brand-primary text-brand-primary" />
          Client rating {job.clientRating.toFixed(1)}
        </div>
      )}

      <div className="space-y-2">
        <p className="text-sm font-medium text-brand-text-muted">Requirements</p>
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-2 text-sm">
            {c.met ? (
              <Check className="w-4 h-4 text-brand-primary shrink-0" />
            ) : (
              <X className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span className={c.met ? 'text-brand-text' : 'text-red-400'}>{c.label}</span>
          </div>
        ))}
      </div>

      {onAccept && job.status === 'open' && (
        <button
          type="button"
          onClick={onAccept}
          disabled={!canAccept}
          className="app-button-primary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Accept assignment
        </button>
      )}
    </div>
  );
}
