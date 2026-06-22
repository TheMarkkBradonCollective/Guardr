import React from 'react';
import { SecurityGuard } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import {
  checkJobRequirements,
  getJobDistance,
} from '../../lib/guardJobs';
import { JOB_STATUS_LABELS } from '../../lib/jobStatus';
import { guardHasApplied } from '../../lib/jobApplications';
import { JobBillingSummaryFromGuardJob } from '../jobs/JobBillingSummary';
import { JobSelfAuditPhotosSection } from '../jobs/JobSelfAuditPhotosSection';
import { JobListingProfile } from '../jobs/JobListingProfile';
import { WfBadge } from '../ui/wireframe';
import { Check, X } from 'lucide-react';

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
  const hasApplied = guardHasApplied(job, guard.id);
  const isUpcoming = job.status === 'accepted';
  const isDirectRequest = job.requestType === 'direct';

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <WfBadge>{JOB_STATUS_LABELS[job.status]}</WfBadge>
          {isUpcoming && <WfBadge tone="primary">Upcoming job</WfBadge>}
          {isDirectRequest && job.status === 'open' && (
            <WfBadge tone="warning">Direct request</WfBadge>
          )}
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

      <JobListingProfile
        job={job}
        showClientHeader
        showBadges={false}
        distanceMiles={distance}
        payLine={<JobBillingSummaryFromGuardJob job={job} />}
        operationalDetails={job.operationalDetails}
        operationalBriefingLocked={job.operationalBriefingLocked}
        jobStatus={job.status}
        footer={
          <div className="space-y-3">
            <JobSelfAuditPhotosSection request={job} hideStaffAttribution />
            <div className="space-y-3 border-t border-brand-border pt-3">
              <div>
                <p className="text-sm font-medium text-brand-text-muted">Your qualification checklist</p>
                <p className="text-xs text-brand-text-muted mt-0.5">
                  A valid guard card is required to apply. Training items marked as recommended are not required.
                </p>
              </div>
              {checks.map((c) => (
                <div key={c.label} className="flex items-center gap-2 text-sm">
                  {c.met ? (
                    <Check className="w-4 h-4 text-brand-primary shrink-0" />
                  ) : c.recommended ? (
                    <span className="w-4 h-4 shrink-0 text-center text-brand-text-muted text-xs leading-4">·</span>
                  ) : (
                    <X className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  <span
                    className={
                      c.met
                        ? 'text-brand-text'
                        : c.recommended
                          ? 'text-brand-text-muted'
                          : 'text-red-400'
                    }
                  >
                    {c.label}
                  </span>
                </div>
              ))}

              {hasApplied && job.status === 'open' && (
                <p className="text-sm text-brand-primary bg-brand-primary/10 border border-brand-primary/25 rounded-lg px-3 py-2.5">
                  Application submitted. Guardr staff will review applicants and approve the best fit.
                </p>
              )}

              {onAccept && job.status === 'open' && !hasApplied && canAccept && (
                <button type="button" onClick={onAccept} className="app-button-primary">
                  Apply for this job
                </button>
              )}

              {onAccept && job.status === 'open' && !hasApplied && !canAccept && (
                <p className="text-sm text-amber-400/95 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2.5">
                  You must meet all requirements above before you can apply for this offer.
                </p>
              )}
            </div>
          </div>
        }
      />
    </div>
  );
}
