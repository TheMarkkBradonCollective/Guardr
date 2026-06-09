import React from 'react';
import { SecurityGuard } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { JOB_CATEGORIES, JobCategoryId, getGuardHourlyPay } from '../../lib/guardJobs';
import { formatShiftRange } from '../../lib/dates';
import { GuardJobCard } from './GuardJobCard';
import { Calendar, ChevronRight } from 'lucide-react';

interface GuardJobsPanelContentProps {
  jobs: GuardJobView[];
  upcomingShifts: GuardJobView[];
  guard: SecurityGuard;
  selectedJob: GuardJobView | null;
  selectedCategory: JobCategoryId | null;
  onSelectCategory: (id: JobCategoryId | null) => void;
  onSelectJob: (job: GuardJobView | null) => void;
  onAcceptJob: (jobId: string) => void;
}

export function GuardJobsPanelContent({
  jobs,
  upcomingShifts,
  guard,
  selectedJob,
  selectedCategory,
  onSelectCategory,
  onSelectJob,
  onAcceptJob,
}: GuardJobsPanelContentProps) {
  if (selectedJob) {
    return (
      <GuardJobCard
        job={selectedJob}
        guard={guard}
        onClose={() => onSelectJob(null)}
        onAccept={
          selectedJob.status === 'open'
            ? () => {
                onAcceptJob(selectedJob.id);
                onSelectJob(null);
              }
            : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-5">
      {upcomingShifts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-primary" />
            <p className="text-sm font-medium text-brand-text-muted">Upcoming assignments</p>
          </div>
          {upcomingShifts.map((shift) => (
            <button
              key={shift.id}
              type="button"
              onClick={() => onSelectJob(shift)}
              className="w-full text-left rounded-2xl border border-brand-primary/30 bg-brand-primary/8 p-4 hover:bg-brand-primary/12 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{shift.title}</p>
                  <p className="text-sm text-brand-text-muted mt-1 truncate">
                    {formatShiftRange(shift.startDate, shift.endDate)}
                  </p>
                  <p className="text-sm font-medium text-brand-primary mt-1">
                    ${getGuardHourlyPay(shift)}/hr
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-brand-primary shrink-0" />
              </div>
            </button>
          ))}
        </div>
      )}

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

      <div className="space-y-2">
        <p className="text-sm font-medium text-brand-text-muted">Nearby jobs</p>
        {jobs.length === 0 ? (
          <p className="text-center text-brand-text-muted py-10">No jobs in this category right now.</p>
        ) : (
          jobs.map((job) => (
            <div key={job.id}>
              <GuardJobCard
                job={job}
                guard={guard}
                compact
                onSelect={() => onSelectJob(job)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
