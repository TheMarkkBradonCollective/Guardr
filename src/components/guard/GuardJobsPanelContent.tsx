import React from 'react';
import { SecurityGuard } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { JOB_CATEGORIES, JobCategoryId } from '../../lib/guardJobs';
import { AppItemCardStack } from '../ui/app/AppPrimitives';
import { GuardJobCard } from './GuardJobCard';

interface GuardJobsPanelContentProps {
  jobs: GuardJobView[];
  guard: SecurityGuard;
  selectedJob: GuardJobView | null;
  selectedCategory: JobCategoryId | null;
  onSelectCategory: (id: JobCategoryId | null) => void;
  onSelectJob: (job: GuardJobView | null) => void;
  onAcceptJob: (jobId: string) => void;
  splitView?: boolean;
}

function CategoryFilters({
  selectedCategory,
  onSelectCategory,
}: {
  selectedCategory: JobCategoryId | null;
  onSelectCategory: (id: JobCategoryId | null) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
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

function JobOffersList({
  jobs,
  guard,
  selectedJobId,
  splitView,
  onSelectJob,
}: {
  jobs: GuardJobView[];
  guard: SecurityGuard;
  selectedJobId: string | null;
  splitView: boolean;
  onSelectJob: (job: GuardJobView | null) => void;
}) {
  if (jobs.length === 0) {
    return <p className="text-center text-brand-text-muted py-10">No jobs in this category right now.</p>;
  }

  return (
    <AppItemCardStack>
      {jobs.map((job) => {
        const isSelected = selectedJobId === job.id;
        const handleSelect = () => {
          if (!splitView && isSelected) {
            onSelectJob(null);
            return;
          }
          onSelectJob(job);
        };

        return (
          <div key={job.id} className={!splitView && isSelected ? 'space-y-3' : undefined}>
            <GuardJobCard
              job={job}
              guard={guard}
              compact
              onSelect={handleSelect}
            />
          </div>
        );
      })}
    </AppItemCardStack>
  );
}

export function GuardJobsPanelContent({
  jobs,
  guard,
  selectedJob,
  selectedCategory,
  onSelectCategory,
  onSelectJob,
  onAcceptJob,
  splitView = false,
}: GuardJobsPanelContentProps) {
  const resolvedSelectedId =
    selectedJob?.id ??
    (splitView && jobs.length > 0 ? jobs[0].id : null);

  const resolvedSelectedJob =
    jobs.find((job) => job.id === resolvedSelectedId) ?? selectedJob;

  const listContent = (
    <div className="space-y-5">
      <CategoryFilters selectedCategory={selectedCategory} onSelectCategory={onSelectCategory} />
      <div className="space-y-2">
        <p className="text-sm font-medium text-brand-text-muted">Available offers</p>
        <JobOffersList
          jobs={jobs}
          guard={guard}
          selectedJobId={splitView ? resolvedSelectedId : selectedJob?.id ?? null}
          splitView={splitView}
          onSelectJob={onSelectJob}
        />
      </div>
    </div>
  );

  if (splitView) {
    return (
      <div className="tablet-split-panel !min-h-0">
        <div className="max-h-[75vh] overflow-y-auto pr-1">{listContent}</div>
        {resolvedSelectedJob && (
          <div className="staff-detail-pane min-h-0 overflow-y-auto">
            <GuardJobCard
              job={resolvedSelectedJob}
              guard={guard}
              onClose={() => onSelectJob(null)}
              onAccept={
                resolvedSelectedJob.status === 'open'
                  ? () => {
                      onAcceptJob(resolvedSelectedJob.id);
                      onSelectJob(null);
                    }
                  : undefined
              }
            />
          </div>
        )}
      </div>
    );
  }

  if (selectedJob) {
    return (
      <div className="space-y-5">
        <CategoryFilters selectedCategory={selectedCategory} onSelectCategory={onSelectCategory} />
        <div className="space-y-2">
          <p className="text-sm font-medium text-brand-text-muted">Available offers</p>
          <AppItemCardStack>
            {jobs.map((job) => {
              const isSelected = selectedJob.id === job.id;
              const handleSelect = () => onSelectJob(isSelected ? null : job);

              return (
                <div key={job.id} className={isSelected ? 'space-y-3' : undefined}>
                  <GuardJobCard job={job} guard={guard} compact onSelect={handleSelect} />
                  {isSelected && (
                    <div className="staff-detail-pane">
                      <GuardJobCard
                        job={job}
                        guard={guard}
                        onClose={() => onSelectJob(null)}
                        onAccept={
                          job.status === 'open'
                            ? () => {
                                onAcceptJob(job.id);
                                onSelectJob(null);
                              }
                            : undefined
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </AppItemCardStack>
        </div>
      </div>
    );
  }

  return listContent;
}
