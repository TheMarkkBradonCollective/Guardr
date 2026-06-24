import React from 'react';
import { SecurityGuard } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import {
  checkJobRequirements,
  getJobDistance,
} from '../../lib/guardJobs';
import { JOB_STATUS_LABELS } from '../../lib/jobStatus';
import { guardHasApplied } from '../../lib/jobApplications';
import { isMultiGuardJob } from '../../lib/guardTeams';
import { GuardTeamPanel } from './GuardTeamPanel';
import { JobBillingSummaryFromGuardJob } from '../jobs/JobBillingSummary';
import { JobSelfAuditPhotosSection } from '../jobs/JobSelfAuditPhotosSection';
import { JobListingProfile } from '../jobs/JobListingProfile';
import { WfBadge } from '../ui/wireframe';
import { SlideToConfirm } from '../ui/SlideToConfirm';
import { Check, X } from 'lucide-react';

interface GuardJobDetailContentProps {
  job: GuardJobView;
  guard: SecurityGuard;
  coworkerGuards?: SecurityGuard[];
  onAccept?: () => void;
  onDeclineDirectJob?: () => void;
  onApplyAsLead?: () => void | Promise<void>;
  onApplyOpenSlot?: () => void | Promise<void>;
  onInviteGuard?: (guardId: string) => void | Promise<void>;
  onAcceptInvite?: () => void | Promise<void>;
  onDeclineInvite?: () => void | Promise<void>;
  onClose?: () => void;
}

export function GuardJobDetailContent({
  job,
  guard,
  coworkerGuards = [],
  onAccept,
  onDeclineDirectJob,
  onApplyAsLead,
  onApplyOpenSlot,
  onInviteGuard,
  onAcceptInvite,
  onDeclineInvite,
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
              </div>
              <div className="divide-y divide-brand-border">
                {checks.map((c) => (
                  <div key={c.label} className="flex items-center gap-2.5 text-sm py-2.5">
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
              </div>

              {hasApplied && job.status === 'open' && job.pendingGuardId === guard.id && (
                <p className="text-sm text-brand-primary bg-brand-primary/10 border border-brand-primary/25 rounded-lg px-3 py-2.5 font-semibold">
                  Awaiting client confirmation for this job.
                </p>
              )}

              {hasApplied && job.status === 'open' && job.pendingGuardId !== guard.id && !isMultiGuardJob(job) && (
                <p className="text-sm text-brand-primary bg-brand-primary/10 border border-brand-primary/25 rounded-lg px-3 py-2.5">
                  Application submitted. Guardr staff will review applicants and send the best fit for client approval.
                </p>
              )}

              {isMultiGuardJob(job) && job.status === 'open' && (
                <GuardTeamPanel
                  job={job}
                  guard={guard}
                  coworkerGuards={coworkerGuards}
                  onApplyAsLead={onApplyAsLead}
                  onApplyOpenSlot={onApplyOpenSlot}
                  onInviteGuard={onInviteGuard}
                  onAcceptInvite={onAcceptInvite}
                  onDeclineInvite={onDeclineInvite}
                />
              )}

              {/* Direct request to this guard — confirm or decline */}
              {isDirectRequest && job.status === 'open' && !hasApplied && (
                <div className="space-y-2.5">
                  <p className="text-sm text-brand-text-muted">
                    A client requested you for this job. Accept to take it or decline to open it to other guards.
                  </p>
                  {canAccept ? (
                    <div className="flex gap-2">
                      {onAccept && (
                        <button
                          type="button"
                          onClick={onAccept}
                          className="app-button-primary flex-1 py-3 text-sm font-bold"
                        >
                          Accept job
                        </button>
                      )}
                      {onDeclineDirectJob && (
                        <button
                          type="button"
                          onClick={onDeclineDirectJob}
                          className="app-button-outline flex-1 py-3 text-sm text-red-400 border-red-500/40"
                        >
                          Decline
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-amber-400/95 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2.5">
                        You must meet all requirements above before you can accept this offer.
                      </p>
                      {onDeclineDirectJob && (
                        <button
                          type="button"
                          onClick={onDeclineDirectJob}
                          className="app-button-outline w-full py-3 text-sm text-red-400 border-red-500/40"
                        >
                          Decline — open to other guards
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Marketplace job — slide to apply */}
              {!isDirectRequest && onAccept && job.status === 'open' && !hasApplied && canAccept && !isMultiGuardJob(job) && (
                <SlideToConfirm
                  label="Slide to apply for job"
                  confirmedLabel="Applied"
                  onConfirm={onAccept}
                />
              )}

              {!isDirectRequest && onAccept && job.status === 'open' && !hasApplied && !canAccept && (
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
