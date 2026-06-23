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
import { SlideToConfirm } from '../ui/SlideToConfirm';
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
                <p className="text-[11px] font-bold uppercase tracking-[0.07em] text-brand-text-muted">Your qualification checklist</p>
                <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
                  A valid guard card is required to apply. Training items marked as recommended are not required.
                </p>
              </div>
              {checks.map((c) => (
                <div key={c.label} className="flex items-center gap-2.5 text-sm py-0.5">
                  {c.met ? (
                    <span className="w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </span>
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

              {hasApplied && job.status === 'open' && job.pendingGuardId === guard.id && (
                <p className="text-sm text-brand-primary bg-brand-primary/10 border border-brand-primary/25 rounded-lg px-3 py-2.5 font-semibold">
                  Guardr approved you for this job — awaiting client confirmation.
                </p>
              )}

              {hasApplied && job.status === 'open' && job.pendingGuardId !== guard.id && (
                <p className="text-sm text-brand-primary bg-brand-primary/10 border border-brand-primary/25 rounded-lg px-3 py-2.5">
                  Application submitted. Guardr staff will review applicants and send the best fit for client approval.
                </p>
              )}

              {onAccept && job.status === 'open' && !hasApplied && canAccept && (
                <SlideToConfirm
                  label={isDirectRequest ? 'Slide to claim job' : 'Slide to apply for job'}
                  confirmedLabel={isDirectRequest ? 'Claimed' : 'Applied'}
                  onConfirm={onAccept}
                />
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
