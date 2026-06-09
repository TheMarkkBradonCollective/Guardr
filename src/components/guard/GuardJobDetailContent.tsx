import React from 'react';
import { SecurityGuard } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import {
  checkJobRequirements,
  formatJobDate,
  formatJobTimeRange,
  getJobDistance,
  JOB_TYPE_LABELS,
  getJobRequiredCredentialLabels,
  guardJobMinQualificationLabel,
} from '../../lib/guardJobs';
import { formatDuration, formatShiftRange } from '../../lib/dates';
import { formatStateName } from '../../lib/states';
import { JOB_STATUS_LABELS } from '../../lib/jobStatus';
import { JobBillingSummaryFromGuardJob } from '../jobs/JobBillingSummary';
import { WfBadge } from '../ui/wireframe';
import { MapPin, Star, Clock, Check, X } from 'lucide-react';

function DetailBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  if (children == null || children === '') return null;
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-brand-text-muted">{label}</p>
      <div className="text-sm text-brand-text">{children}</div>
    </div>
  );
}

interface GuardJobDetailContentProps {
  job: GuardJobView;
  guard: SecurityGuard;
  onAccept?: () => void;
  onClose?: () => void;
}

export function GuardJobDetailContent({
  job,
  guard,
  onAccept,
  onClose,
}: GuardJobDetailContentProps) {
  const distance = getJobDistance(job);
  const { checks, canAccept } = checkJobRequirements(guard, job);
  const isUpcoming = job.status === 'accepted';
  const isDirectRequest = job.requestType === 'direct';
  const requiredCredentialLabels = getJobRequiredCredentialLabels(job);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2 mb-2">
            <WfBadge>{JOB_STATUS_LABELS[job.status]}</WfBadge>
            {isUpcoming && <WfBadge tone="primary">Upcoming job</WfBadge>}
            {isDirectRequest && job.status === 'open' && (
              <WfBadge tone="warning">Direct request</WfBadge>
            )}
            {job.armedRequired && <WfBadge tone="warning">Armed post</WfBadge>}
          </div>
          <h3 className="text-xl font-bold tracking-tight leading-tight">{job.title}</h3>
          <p className="text-sm text-brand-text-muted mt-1">{job.clientName}</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-brand-text-muted hover:text-brand-text p-1 text-lg"
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>

      <div className="space-y-3 border-t border-brand-border pt-3">
        <DetailBlock label="Location">
          <p className="flex items-start gap-1.5">
            <MapPin className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
            <span>
              {job.siteName && <span className="block font-medium">{job.siteName}</span>}
              {job.address && <span className="block">{job.address}</span>}
              <span className="block text-brand-text-muted">{job.location}</span>
              {job.state && (
                <span className="block text-brand-text-muted">
                  {formatStateName(job.state)} · {distance} mi away
                </span>
              )}
            </span>
          </p>
        </DetailBlock>

        <DetailBlock label="Schedule">
          <p>{formatShiftRange(job.startDate, job.endDate)}</p>
          <p className="text-brand-text-muted mt-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {formatJobDate(job)} · {formatJobTimeRange(job)} · {formatDuration(job.durationHours)}
          </p>
        </DetailBlock>

        <DetailBlock label="Assignment type">
          {JOB_TYPE_LABELS[job.type]}
          {job.guardsNeeded != null && job.guardsNeeded > 1
            ? ` · ${job.guardsNeeded} guards needed`
            : null}
        </DetailBlock>

        <DetailBlock label="Minimum guard status">
          {guardJobMinQualificationLabel(job.minGuardQualification)}
        </DetailBlock>

        {job.description && <DetailBlock label="Description">{job.description}</DetailBlock>}

        {job.siteInstructions && (
          <DetailBlock label="Site instructions">{job.siteInstructions}</DetailBlock>
        )}

        {job.uniformRequirements && (
          <DetailBlock label="Uniform">{job.uniformRequirements}</DetailBlock>
        )}

        {job.equipmentRequirements && (
          <DetailBlock label="Equipment">{job.equipmentRequirements}</DetailBlock>
        )}

        <DetailBlock label="Required credentials">
          <div className="flex flex-wrap gap-1.5 mt-1">
            {requiredCredentialLabels.map((label) => (
              <span key={label} className="chip chip-inactive text-xs">
                {label}
              </span>
            ))}
          </div>
        </DetailBlock>
      </div>

      <div className="border-t border-brand-border pt-3">
        <p className="text-xs font-medium text-brand-text-muted mb-2">Your pay</p>
        <JobBillingSummaryFromGuardJob job={job} />
      </div>

      {job.clientRating != null && (
        <div className="flex items-center gap-2 text-sm text-brand-text-muted">
          <Star className="w-4 h-4 fill-brand-primary text-brand-primary" />
          Client rating {job.clientRating.toFixed(1)}
        </div>
      )}

      <div className="space-y-2 border-t border-brand-border pt-3">
        <div>
          <p className="text-sm font-medium text-brand-text-muted">Requirements checklist</p>
          <p className="text-xs text-brand-text-muted mt-0.5">
            Credentials you need on file to accept this job.
          </p>
        </div>
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
