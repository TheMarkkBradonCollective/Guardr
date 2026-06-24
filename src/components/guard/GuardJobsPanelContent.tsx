import React from 'react';
import { SecurityGuard } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { JOB_CATEGORIES, JobCategoryId } from '../../lib/guardJobs';
import { AppItemCardStack } from '../ui/app/AppPrimitives';
import { GuardJobCard } from './GuardJobCard';

interface GuardJobsPanelContentProps {
  jobs: GuardJobView[];
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
  onJoinTeamWithCode?: (code: string) => void | Promise<void>;
  onAcceptTeamInvite?: (jobId: string) => void | Promise<void>;
  onDeclineTeamInvite?: (jobId: string) => void | Promise<void>;
  onOpenTeamChat?: (jobId: string) => void;
  scheduleRequests?: import('../../lib/guardSchedule').ScheduleJob[];
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
  onJoinTeamWithCode,
  onAcceptTeamInvite,
  onDeclineTeamInvite,
  onOpenTeamChat,
  scheduleRequests,
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
        onJoinWithTeamCode={onJoinTeamWithCode}
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
        onOpenTeamChat={
          onOpenTeamChat ? () => onOpenTeamChat(selectedJob.id) : undefined
        }
        scheduleRequests={scheduleRequests}
      />
    );
  }

  return (
    <div className="space-y-5">
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
