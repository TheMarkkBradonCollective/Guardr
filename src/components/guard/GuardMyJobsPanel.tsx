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

function GuardMyJobDetail({
  job,
  guard,
  jobChatThreads,
  onOpenMessages,
  onApproveOvertime,
}: {
  job: GuardJobView;
  guard: SecurityGuard;
  jobChatThreads: JobChatThread[];
  onOpenMessages?: (jobId: string) => void;
  onApproveOvertime?: (requestId: string) => void | Promise<void>;
}) {
  const [overtimeApproveId, setOvertimeApproveId] = useState<string | null>(null);
  const chatEligible = isJobChatEligible(job);
  const hasChat = chatEligible || threadForRequest(jobChatThreads, job.id);
  const jobAsRequest = job as unknown as SecurityRequest;
  const jobIncidents = buildIncidentReportViews([jobAsRequest], [guard]);
  const hasIncidents = listIncidentReportsForRequest(jobAsRequest).length > 0;

  return (
    <div className="px-5 pb-8 space-y-4">
      <GuardJobCard job={job} guard={guard} compact />
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
      {canGuardApproveOvertime(job) && onApproveOvertime && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3 space-y-3">
          <p className="text-sm font-semibold text-amber-300">Late clock-out overtime</p>
          <p className="text-xs text-brand-text-muted leading-relaxed">
            You clocked out {(job.overtimeHours ?? 0)}h after scheduled end.
            Confirm to request ${(job.overtimeGuardEarnings ?? 0).toFixed(2)} in additional pay.
          </p>
          <button
            type="button"
            onClick={async () => {
              setOvertimeApproveId(job.id);
              try {
                await onApproveOvertime(job.id);
              } finally {
                setOvertimeApproveId(null);
              }
            }}
            disabled={overtimeApproveId === job.id}
            className="w-full app-button-primary !h-10 gap-1.5 disabled:opacity-50"
          >
            {overtimeApproveId === job.id ? (
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
          onClick={() => onOpenMessages(job.id)}
          className="w-full app-button-outline !h-11 flex items-center justify-center gap-2"
        >
          <MessageCircle className="w-4 h-4" />
          {chatEligible ? 'Message client' : 'View job chat'}
        </button>
      )}
    </div>
  );
}

function renderJobRow(
  job: GuardJobView,
  onSelect: () => void,
  accent = false
) {
  return (
    <AppItemCard
      key={job.id}
      onClick={onSelect}
      className={accent ? 'border-brand-primary/30 bg-brand-primary/8' : undefined}
    >
      <div className="min-w-0 flex-1 text-left">
        <p className="font-semibold truncate">{job.title}</p>
        <p className="text-sm text-brand-text-muted mt-1 truncate">
          {formatShiftRange(job.startDate, job.endDate)}
        </p>
        {accent && (
          <p className="text-sm font-medium text-brand-primary mt-1">
            ${getGuardHourlyPay(job)}/hr
          </p>
        )}
      </div>
    </AppItemCard>
  );
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

  useEffect(() => {
    if (initialSelectedJobId) {
      setSelectedId(initialSelectedJobId);
    }
  }, [initialSelectedJobId]);

  const updateSelectedId = (jobId: string | null) => {
    setSelectedId(jobId);
    onSelectedJobIdChange?.(jobId);
  };

  const allJobs = useMemo(() => [...upcomingJobs, ...pastJobs], [upcomingJobs, pastJobs]);
  const selectedJob = allJobs.find((j) => j.id === selectedId) ?? null;

  if (selectedJob) {
    return (
      <AppScreen className="app-full-page-detail">
        <AppSubScreenHeader title={selectedJob.title} onBack={() => updateSelectedId(null)} />
        <GuardMyJobDetail
          job={selectedJob}
          guard={guard}
          jobChatThreads={jobChatThreads}
          onOpenMessages={onOpenMessages}
          onApproveOvertime={onApproveOvertime}
        />
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
            {upcomingJobs.map((job) =>
              renderJobRow(job, () => updateSelectedId(job.id), true)
            )}
          </AppItemCardStack>
        )}
      </AppSection>

      <AppSection title="Past">
        {pastJobs.length === 0 ? (
          <p className="app-empty-state">No completed jobs yet.</p>
        ) : (
          <AppItemCardStack>
            {pastJobs.map((job) => renderJobRow(job, () => updateSelectedId(job.id)))}
          </AppItemCardStack>
        )}
      </AppSection>
    </AppScreen>
  );
}
