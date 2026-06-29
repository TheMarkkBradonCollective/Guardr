import React from 'react';
import { SecurityGuard } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { JOB_CATEGORIES, JobCategoryId } from '../../lib/guardJobs';
import { AppItemCardStack } from '../ui/app/AppPrimitives';
import { GuardJobCard } from './GuardJobCard';
import { formatScheduledJobWhen, sortScheduledJobs } from '../../lib/guardScheduledJobs';

interface GuardJobsPanelContentProps {
  jobs: GuardJobView[];
  scheduledJobs?: GuardJobView[];
  guard: SecurityGuard;
  coworkerGuards?: SecurityGuard[];
  selectedJob: GuardJobView | null;
  selectedCategory: JobCategoryId | null;
  onSelectCategory: (id: JobCategoryId | null) => void;
  onSelectJob: (job: GuardJobView | null) => void;
  onAcceptJob: (jobId: string) => void;
  onDeclineDirectJob?: (jobId: string) => void | Promise<void>;
  onApplyAsTeamLead?: (jobId: string) => void | Promise<void>;
  onInviteTeamGuard?: (jobId: string, guardId: string) => void | Promise<void>;
  onRemoveTeamGuard?: (jobId: string, guardId: string) => void | Promise<void>;
  onUpdateCrewProfile?: (
    jobId: string,
    patch: { crewName: string; crewDescription: string }
  ) => void | Promise<void>;
  onAcceptTeamInvite?: (jobId: string) => void | Promise<void>;
  onDeclineTeamInvite?: (jobId: string) => void | Promise<void>;
  scheduleRequests?: import('../../lib/guardSchedule').ScheduleJob[];
  feeConfig?: import('../../lib/payments').PlatformFeeConfig;
  onSubmitPriceOffer?: (
    jobId: string,
    input: {
      hourlyRate: number;
      agreementFeeConfig?: import('../../types').AgreementPlatformFeeConfig;
      message?: string;
    }
  ) => void | Promise<void>;
  onAcceptPriceOffer?: (jobId: string, offerId: string) => void | Promise<void>;
}

function CategoryFilters({
  selectedCategory,
  onSelectCategory,
}: {
  selectedCategory: JobCategoryId | null;
  onSelectCategory: (id: JobCategoryId | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() => onSelectCategory(null)}
        className={`chip shrink-0 ${!selectedCategory ? 'chip-active' : 'chip-inactive'}`}
      >
        All
      </button>
      {JOB_CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onSelectCategory(selectedCategory === cat.id ? null : cat.id)}
          className={`chip shrink-0 ${selectedCategory === cat.id ? 'chip-active' : 'chip-inactive'}`}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}

export function GuardJobsPanelContent({
  jobs,
  scheduledJobs = [],
  guard,
  coworkerGuards,
  selectedJob,
  selectedCategory,
  onSelectCategory,
  onSelectJob,
  onAcceptJob,
  onDeclineDirectJob,
  onApplyAsTeamLead,
  onInviteTeamGuard,
  onRemoveTeamGuard,
  onUpdateCrewProfile,
  onAcceptTeamInvite,
  onDeclineTeamInvite,
  scheduleRequests,
  feeConfig,
  onSubmitPriceOffer,
  onAcceptPriceOffer,
}: GuardJobsPanelContentProps) {
  if (selectedJob) {
    return (
      <GuardJobCard
        job={selectedJob}
        guard={guard}
        coworkerGuards={coworkerGuards}
        onClose={() => onSelectJob(null)}
        onAccept={
          selectedJob.status === 'open'
            ? () => {
                onAcceptJob(selectedJob.id);
                onSelectJob(null);
              }
            : undefined
        }
        onDeclineDirectJob={
          onDeclineDirectJob && selectedJob.status === 'open'
            ? () => {
                void onDeclineDirectJob(selectedJob.id);
                onSelectJob(null);
              }
            : undefined
        }
        onApplyAsLead={
          onApplyAsTeamLead && selectedJob.status === 'open'
            ? () => void onApplyAsTeamLead(selectedJob.id)
            : undefined
        }
        onInviteGuard={
          onInviteTeamGuard && selectedJob.status === 'open'
            ? (guardId) => void onInviteTeamGuard(selectedJob.id, guardId)
            : undefined
        }
        onRemoveGuard={
          onRemoveTeamGuard && selectedJob.status === 'open'
            ? (guardId) => void onRemoveTeamGuard(selectedJob.id, guardId)
            : undefined
        }
        onUpdateCrewProfile={
          onUpdateCrewProfile && selectedJob.status === 'open'
            ? (patch) => void onUpdateCrewProfile(selectedJob.id, patch)
            : undefined
        }
        onAcceptInvite={
          onAcceptTeamInvite && selectedJob.status === 'open'
            ? () => void onAcceptTeamInvite(selectedJob.id)
            : undefined
        }
        onDeclineInvite={
          onDeclineTeamInvite && selectedJob.status === 'open'
            ? () => void onDeclineTeamInvite(selectedJob.id)
            : undefined
        }
        scheduleRequests={scheduleRequests}
        feeConfig={feeConfig}
        onSubmitPriceOffer={
          onSubmitPriceOffer
            ? (input) => void onSubmitPriceOffer(selectedJob.id, input)
            : undefined
        }
        onAcceptPriceOffer={
          onAcceptPriceOffer
            ? (offerId) => void onAcceptPriceOffer(selectedJob.id, offerId)
            : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      {scheduledJobs.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-brand-text-muted">Scheduled</p>
          <AppItemCardStack>
            {sortScheduledJobs(scheduledJobs).map((job) => (
              <button
                key={job.id}
                type="button"
                onClick={() => onSelectJob(job)}
                className="app-list-row w-full text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold truncate">{job.title}</p>
                  <p className="text-xs text-brand-text-muted truncate mt-0.5">
                    {job.siteName || job.location}
                  </p>
                </div>
                <span className="text-xs font-semibold text-brand-primary shrink-0">
                  {formatScheduledJobWhen(job.startDate)}
                </span>
              </button>
            ))}
          </AppItemCardStack>
        </div>
      )}
      <CategoryFilters selectedCategory={selectedCategory} onSelectCategory={onSelectCategory} />
      <div className="space-y-2">
        <p className="text-sm font-medium text-brand-text-muted">Available offers</p>
        {jobs.length === 0 ? (
          <p className="text-center text-brand-text-muted py-10">No jobs in this category right now.</p>
        ) : (
          <AppItemCardStack>
            {jobs.map((job) => (
              <GuardJobCard
                key={job.id}
                job={job}
                guard={guard}
                compact
                onSelect={() => onSelectJob(job)}
              />
            ))}
          </AppItemCardStack>
        )}
      </div>
    </div>
  );
}
