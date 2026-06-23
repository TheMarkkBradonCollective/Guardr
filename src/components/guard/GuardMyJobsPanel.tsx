import React, { useMemo, useState, useEffect } from 'react';
import { JobChatThread, SecurityGuard, SecurityRequest, SessionUser } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { formatShiftRange } from '../../lib/dates';
import { getGuardHourlyPay } from '../../lib/guardJobs';
import { isJobChatEligible, threadForRequest } from '../../lib/jobChat';
import { canGuardApproveOvertime } from '../../lib/shiftBilling';
import { buildIncidentReportViews, listIncidentReportsForRequest } from '../../lib/incidentReports';
import { IncidentReportDetailView } from '../reports/IncidentReportDetailView';
import { AppItemCard, AppItemCardStack, AppScreen, AppSection, AppSubScreenHeader } from '../ui/app/AppPrimitives';
import { GuardJobCard } from './GuardJobCard';
import { CheckCircle2, Loader2, MessageCircle } from 'lucide-react';

interface GuardMyJobsPanelProps {
  upcomingJobs: GuardJobView[];
  pastJobs: GuardJobView[];
  guard: SecurityGuard;
  currentUser: SessionUser;
  jobChatThreads?: JobChatThread[];
  initialSelectedJobId?: string | null;
  onSelectedJobIdChange?: (jobId: string | null) => void;
  onOpenMessages?: (jobId: string) => void;
  onApproveOvertime?: (requestId: string) => void | Promise<void>;
}

export function GuardMyJobsPanel({
  upcomingJobs,
  pastJobs,
  guard,
  jobChatThreads = [],
  initialSelectedJobId = null,
  onSelectedJobIdChange,
  onOpenMessages,
  onApproveOvertime,
}: GuardMyJobsPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedJobId);
  const [overtimeApproveId, setOvertimeApproveId] = useState<string | null>(null);

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
    const jobAsRequest = selectedJob as unknown as SecurityRequest;
    const jobIncidents = buildIncidentReportViews([jobAsRequest], [guard]);
    const hasIncidents = listIncidentReportsForRequest(jobAsRequest).length > 0;

    return (
      <AppScreen className="app-full-page-detail">
        <AppSubScreenHeader title={selectedJob.title} onBack={() => updateSelectedId(null)} />
        <div className="px-5 pb-8 space-y-4">
          <GuardJobCard job={selectedJob} guard={guard} compact />
          {hasIncidents && (
            <div className="space-y-3">
              <p className="text-sm font-semibold">Incident reports filed</p>
              {jobIncidents.map((incident) => (
                <div key={incident.id} className="rounded-xl border border-red-500/25 bg-red-500/5 p-4">
                  <IncidentReportDetailView report={incident} compact />
                </div>
              ))}
            </div>
          )}
          {canGuardApproveOvertime(selectedJob) && onApproveOvertime && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 space-y-3">
              <p className="text-sm font-semibold text-amber-300">Late clock-out overtime</p>
              <p className="text-xs text-brand-text-muted leading-relaxed">
                You clocked out {(selectedJob.overtimeHours ?? 0)}h after scheduled end.
                Confirm to request ${(selectedJob.overtimeGuardEarnings ?? 0).toFixed(2)} in additional pay.
              </p>
              <button
                type="button"
                onClick={async () => {
                  setOvertimeApproveId(selectedJob.id);
                  try {
                    await onApproveOvertime(selectedJob.id);
                  } finally {
                    setOvertimeApproveId(null);
                  }
                }}
                disabled={overtimeApproveId === selectedJob.id}
                className="w-full app-button-primary !h-10 gap-1.5 disabled:opacity-50"
              >
                {overtimeApproveId === selectedJob.id ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" /> Approve overtime</>
                )}
              </button>
            </div>
          )}
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
