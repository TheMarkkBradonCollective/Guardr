import React, { useMemo, useState } from 'react';
import { SecurityGuard } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { formatShiftRange } from '../../lib/dates';
import { getGuardHourlyPay } from '../../lib/guardJobs';
import { AppItemCard, AppItemCardStack } from '../ui/app/AppPrimitives';
import { GuardJobCard } from './GuardJobCard';
import { Calendar, ChevronRight, History } from 'lucide-react';

interface GuardMyJobsPanelProps {
  upcomingJobs: GuardJobView[];
  pastJobs: GuardJobView[];
  guard: SecurityGuard;
}

export function GuardMyJobsPanel({ upcomingJobs, pastJobs, guard }: GuardMyJobsPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedJob = useMemo(
    () => [...upcomingJobs, ...pastJobs].find((j) => j.id === selectedId) ?? null,
    [upcomingJobs, pastJobs, selectedId]
  );

  if (selectedJob) {
    return (
      <div className="guard-scroll-panel flex-1 px-4 py-4">
        <GuardJobCard job={selectedJob} guard={guard} onClose={() => setSelectedId(null)} />
      </div>
    );
  }

  return (
    <div className="guard-scroll-panel flex-1 px-4 py-4 space-y-6">
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-primary" />
          <h2 className="text-sm font-medium text-brand-text-muted">Upcoming</h2>
        </div>
        {upcomingJobs.length === 0 ? (
          <p className="text-sm text-brand-text-muted py-4">No upcoming jobs.</p>
        ) : (
          <AppItemCardStack>
            {upcomingJobs.map((job) => (
              <AppItemCard
                key={job.id}
                onClick={() => setSelectedId(job.id)}
                className="border-brand-primary/30 bg-brand-primary/8"
              >
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-semibold truncate">{job.title}</p>
                  <p className="text-sm text-brand-text-muted mt-1 truncate">
                    {formatShiftRange(job.startDate, job.endDate)}
                  </p>
                  <p className="text-sm font-medium text-brand-primary mt-1">
                    ${getGuardHourlyPay(job)}/hr
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-brand-primary shrink-0" />
              </AppItemCard>
            ))}
          </AppItemCardStack>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-brand-text-muted" />
          <h2 className="text-sm font-medium text-brand-text-muted">Past</h2>
        </div>
        {pastJobs.length === 0 ? (
          <p className="text-sm text-brand-text-muted py-4">No completed jobs yet.</p>
        ) : (
          <AppItemCardStack>
            {pastJobs.map((job) => (
              <AppItemCard key={job.id} onClick={() => setSelectedId(job.id)}>
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-semibold truncate">{job.title}</p>
                  <p className="text-sm text-brand-text-muted mt-1 truncate">
                    {formatShiftRange(job.startDate, job.endDate)}
                  </p>
                  <p className="text-sm text-brand-text-muted mt-1 capitalize">
                    {job.status.replace('-', ' ')}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-brand-text-muted shrink-0" />
              </AppItemCard>
            ))}
          </AppItemCardStack>
        )}
      </section>
    </div>
  );
}
