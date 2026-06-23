import React from 'react';
import { SecurityGuard } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import {
  formatJobDate,
  formatJobTimeRange,
  getEstimatedGuardEarnings,
  getGuardHourlyPay,
  getJobDistance,
  JOB_TYPE_LABELS,
} from '../../lib/guardJobs';
import { formatDuration } from '../../lib/dates';
import { GuardJobDetailContent } from './GuardJobDetailContent';
import { WfBadge } from '../ui/wireframe';
import { MapPin } from 'lucide-react';

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
    const distance = getJobDistance(job);
    return (
      <button
        type="button"
        onClick={onSelect}
        className="app-item-card app-item-card-align-top w-full flex-col !items-stretch gap-2.5 text-left"
      >
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-1.5 mb-1.5">
              <WfBadge tone="default">{JOB_TYPE_LABELS[job.type]}</WfBadge>
              {job.armedRequired && <WfBadge tone="warning">Armed</WfBadge>}
              {job.requestType === 'direct' && <WfBadge tone="primary">Direct</WfBadge>}
            </div>
            <p className="font-bold leading-snug tracking-tight">{job.title}</p>
            <p className="text-sm text-brand-text-muted mt-1">{job.clientName}</p>
            <p className="text-xs text-brand-text-muted mt-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" />
              {job.siteName || job.location}
              {distance != null ? ` · ${distance} mi` : ''}
            </p>
            <p className="text-xs text-brand-text-muted mt-0.5">
              {formatJobDate(job)} · {formatJobTimeRange(job)} · {formatDuration(job.durationHours)}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xl font-black text-brand-primary tracking-tight">${hourlyPay}/hr</p>
            <p className="text-xs text-brand-text-muted">${estimated} est.</p>
          </div>
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
