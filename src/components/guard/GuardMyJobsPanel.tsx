import React, { useMemo, useState, useEffect } from 'react';
import { JobChatMessage, JobChatThread, SecurityGuard, SessionUser } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { formatShiftRange } from '../../lib/dates';
import { getGuardHourlyPay } from '../../lib/guardJobs';
import { isJobChatEligible, threadForRequest } from '../../lib/jobChat';
import { AppItemCard, AppItemCardStack } from '../ui/app/AppPrimitives';
import { GuardJobCard } from './GuardJobCard';
import { JobChatPanel } from '../messaging/JobChatPanel';
import { Calendar, ChevronRight, History, MessageCircle } from 'lucide-react';

interface GuardMyJobsPanelProps {
  upcomingJobs: GuardJobView[];
  pastJobs: GuardJobView[];
  guard: SecurityGuard;
  currentUser: SessionUser;
  jobChatThreads?: JobChatThread[];
  jobChatMessages?: JobChatMessage[];
  onSendJobChatMessage?: (requestId: string, body: string) => void | Promise<void>;
  initialSelectedJobId?: string | null;
  initialChatOpen?: boolean;
  onSelectedJobIdChange?: (jobId: string | null) => void;
  onChatOpenChange?: (open: boolean) => void;
}

export function GuardMyJobsPanel({
  upcomingJobs,
  pastJobs,
  guard,
  currentUser,
  jobChatThreads = [],
  jobChatMessages = [],
  onSendJobChatMessage,
  initialSelectedJobId = null,
  initialChatOpen = false,
  onSelectedJobIdChange,
  onChatOpenChange,
}: GuardMyJobsPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedJobId);
  const [chatOpen, setChatOpen] = useState(initialChatOpen);

  useEffect(() => {
    if (initialSelectedJobId) {
      setSelectedId(initialSelectedJobId);
    }
  }, [initialSelectedJobId]);

  useEffect(() => {
    if (initialChatOpen) {
      setChatOpen(true);
    }
  }, [initialChatOpen, initialSelectedJobId]);

  const updateSelectedId = (jobId: string | null) => {
    setSelectedId(jobId);
    onSelectedJobIdChange?.(jobId);
  };

  const updateChatOpen = (open: boolean) => {
    setChatOpen(open);
    onChatOpenChange?.(open);
  };

  const selectedJob = useMemo(
    () => [...upcomingJobs, ...pastJobs].find((j) => j.id === selectedId) ?? null,
    [upcomingJobs, pastJobs, selectedId]
  );

  if (selectedJob && chatOpen && onSendJobChatMessage) {
    return (
      <div className="guard-scroll-panel flex-1 flex flex-col min-h-0">
        <JobChatPanel
          request={selectedJob}
          thread={threadForRequest(jobChatThreads, selectedJob.id) ?? null}
          messages={jobChatMessages}
          currentUser={currentUser}
          onSend={(body) => onSendJobChatMessage(selectedJob.id, body)}
          onBack={() => updateChatOpen(false)}
        />
      </div>
    );
  }

  if (selectedJob) {
    const chatEligible = isJobChatEligible(selectedJob);
    return (
      <div className="guard-scroll-panel flex-1 px-4 py-4 space-y-4">
        <GuardJobCard job={selectedJob} guard={guard} onClose={() => updateSelectedId(null)} />
        {onSendJobChatMessage && (chatEligible || threadForRequest(jobChatThreads, selectedJob.id)) && (
          <button
            type="button"
            onClick={() => updateChatOpen(true)}
            className="w-full app-button-outline !h-11 flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            {chatEligible ? 'Message client' : 'View job chat history'}
          </button>
        )}
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
