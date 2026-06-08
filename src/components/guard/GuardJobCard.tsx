import React from 'react';
import { SecurityRequest, SecurityGuard } from '../../types';
import {
  checkJobRequirements,
  formatJobDate,
  formatJobTimeRange,
  getEstimatedGuardEarnings,
  getGuardHourlyPay,
  getJobDistance,
} from '../../lib/guardJobs';
import { formatDuration } from '../../lib/dates';
import { formatStateName } from '../../lib/states';
import { MapPin, Star, Clock, Check, X } from 'lucide-react';

interface GuardJobCardProps {
  job: SecurityRequest;
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
        className="w-full text-left rounded-2xl surface-muted p-4 hover:border-brand-primary/40 transition-colors"
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

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-2xl font-bold tracking-tight leading-tight">{job.title}</h3>
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

      <div className="surface-muted rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-brand-text-muted">{formatJobDate(job)}</span>
          <span className="font-semibold">{formatJobTimeRange(job)}</span>
        </div>
        <div className="flex items-center justify-between text-sm border-t border-brand-border pt-3">
          <span className="flex items-center gap-1.5 text-brand-text-muted">
            <Clock className="w-4 h-4" />
            {formatDuration(job.durationHours)}
          </span>
          <span className="text-xl font-bold text-brand-primary">${hourlyPay}<span className="text-sm font-medium text-brand-text-muted">/hr</span></span>
        </div>
      </div>

      <div className="rounded-2xl bg-brand-primary/10 border border-brand-primary/25 p-5">
        <p className="text-sm text-brand-text-muted mb-1">Estimated earnings</p>
        <p className="text-4xl font-bold text-brand-primary">${estimated}</p>
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
          className="w-full uber-button-sage disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Accept assignment
        </button>
      )}
    </div>
  );
}
