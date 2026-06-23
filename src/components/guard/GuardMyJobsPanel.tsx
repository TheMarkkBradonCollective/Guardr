import React, { useMemo, useState, useEffect } from 'react';
import { JobChatThread, SecurityGuard, SessionUser } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { formatShiftRange } from '../../lib/dates';
import { getGuardHourlyPay } from '../../lib/guardJobs';
import { isJobChatEligible, threadForRequest } from '../../lib/jobChat';
import { AppItemCard, AppItemCardStack, AppScreen, AppSection, AppSubScreenHeader } from '../ui/app/AppPrimitives';
import { GuardJobCard } from './GuardJobCard';
import { MessageCircle } from 'lucide-react';

interface GuardMyJobsPanelProps {
  upcomingJobs: GuardJobView[];
  pastJobs: GuardJobView[];
  guard: SecurityGuard;
  currentUser: SessionUser;
  jobChatThreads?: JobChatThread[];
  initialSelectedJobId?: string | null;
  onSelectedJobIdChange?: (jobId: string | null) => void;
  onOpenMessages?: (jobId: string) => void;
}

export function GuardMyJobsPanel({
  upcomingJobs,
  pastJobs,
  guard,
  jobChatThreads = [],
  initialSelectedJobId = null,
  onSelectedJobIdChange,
  onOpenMessages,
}: GuardMyJobsPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedJobId);

  useEffect(() => {
    if (initialSelectedJobId) {
      setSelectedId(initialSelectedJobId);
    }
  }, [initialSelectedJobId]);

  const updateSelectedId = (jobId: string | null) => {
    setSelectedId(jobId);
    onSelectedJobIdChange?.(jobId);
  };

  const selectedJob = useMemo(
    () => [...upcomingJobs, ...pastJobs].find((j) => j.id === selectedId) ?? null,
    [upcomingJobs, pastJobs, selectedId]
  );

  if (selectedJob) {
    const chatEligible = isJobChatEligible(selectedJob);
    const hasChat = chatEligible || threadForRequest(jobChatThreads, selectedJob.id);

    return (
      <AppScreen className="app-full-page-detail">
        <AppSubScreenHeader title={selectedJob.title} onBack={() => updateSelectedId(null)} />
        <div className="px-5 pb-8 space-y-4">
          <GuardJobCard job={selectedJob} guard={guard} compact />
          {onOpenMessages && hasChat && (
            <button
              type="button"
              onClick={() => onOpenMessages(selectedJob.id)}
              className="w-full app-button-outline !h-11 flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              {chatEligible ? 'Message client' : 'View job chat'}
            </button>
          )}
        </div>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppSection title="Upcoming">
        {upcomingJobs.length === 0 ? (
          <p className="app-empty-state">No upcoming jobs.</p>
        ) : (
          <AppItemCardStack>
            {upcomingJobs.map((job) => (
              <AppItemCard
                key={job.id}
                onClick={() => updateSelectedId(job.id)}
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
              </AppItemCard>
            ))}
          </AppItemCardStack>
        )}
      </AppSection>

      <AppSection title="Past">
        {pastJobs.length === 0 ? (
          <p className="app-empty-state">No completed jobs yet.</p>
        ) : (
          <AppItemCardStack>
            {pastJobs.map((job) => (
              <AppItemCard key={job.id} onClick={() => updateSelectedId(job.id)}>
                <div className="min-w-0 flex-1 text-left">
                  <p className="font-semibold truncate">{job.title}</p>
                  <p className="text-sm text-brand-text-muted mt-1 truncate">
                    {formatShiftRange(job.startDate, job.endDate)}
                  </p>
                </div>
              </AppItemCard>
            ))}
          </AppItemCardStack>
        )}
      </AppSection>
    </AppScreen>
  );
}
