import React, { useMemo, useState, useEffect } from 'react';
import { JobChatThread, SecurityGuard, SecurityRequest, SessionUser } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { formatShiftRange } from '../../lib/dates';
import { getGuardHourlyPay } from '../../lib/guardJobs';
import { isJobChatEligible, threadForRequest } from '../../lib/jobChat';
import { canGuardApproveOvertime } from '../../lib/shiftBilling';
import { buildIncidentReportViews, listIncidentReportsForRequest } from '../../lib/incidentReports';
import { IncidentReportDetailView } from '../reports/IncidentReportDetailView';
import {
  AppItemCard,
  AppItemCardStack,
  AppScreen,
  AppSegmentedControl,
  AppSubScreenHeader,
} from '../ui/app/AppPrimitives';
import { GuardJobCard } from './GuardJobCard';
import { CheckCircle2, Loader2, MessageCircle } from 'lucide-react';

type JobTab = 'available' | 'upcoming' | 'past';

interface GuardMyJobsPanelProps {
  availableJobs: GuardJobView[];
  upcomingJobs: GuardJobView[];
  pastJobs: GuardJobView[];
  guard: SecurityGuard;
  currentUser: SessionUser;
  jobChatThreads?: JobChatThread[];
  initialSelectedJobId?: string | null;
  onSelectedJobIdChange?: (jobId: string | null) => void;
  onOpenMessages?: (jobId: string) => void;
  onApproveOvertime?: (requestId: string) => void | Promise<void>;
  onAcceptJob?: (jobId: string) => void;
  onDeclineDirectJob?: (jobId: string) => void | Promise<void>;
  coworkerGuards?: SecurityGuard[];
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

function JobRow({
  job,
  onSelect,
  showPay = false,
}: {
  job: GuardJobView;
  onSelect: () => void;
  showPay?: boolean;
}) {
  return (
    <AppItemCard
      onClick={onSelect}
      className={showPay ? 'border-brand-primary/30 bg-brand-primary/8' : undefined}
    >
      <div className="min-w-0 flex-1 text-left">
        <p className="font-semibold truncate">{job.title}</p>
        <p className="text-sm text-brand-text-muted mt-1 truncate">
          {formatShiftRange(job.startDate, job.endDate)}
        </p>
        {showPay && (
          <p className="text-sm font-medium text-brand-primary mt-1">
            ${getGuardHourlyPay(job)}/hr
          </p>
        )}
      </div>
    </AppItemCard>
  );
}

const TAB_OPTIONS: { id: JobTab; label: string }[] = [
  { id: 'available', label: 'Available' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'past', label: 'Past' },
];

export function GuardMyJobsPanel({
  availableJobs,
  upcomingJobs,
  pastJobs,
  guard,
  jobChatThreads = [],
  initialSelectedJobId = null,
  onSelectedJobIdChange,
  onOpenMessages,
  onApproveOvertime,
  onAcceptJob,
  onDeclineDirectJob,
  coworkerGuards,
}: GuardMyJobsPanelProps) {
  const [activeTab, setActiveTab] = useState<JobTab>('available');
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

  const allJobs = useMemo(
    () => [...availableJobs, ...upcomingJobs, ...pastJobs],
    [availableJobs, upcomingJobs, pastJobs]
  );
  const selectedJob = allJobs.find((j) => j.id === selectedId) ?? null;

  if (selectedJob) {
    const isAvailable = selectedJob.status === 'open';
    return (
      <AppScreen className="app-full-page-detail">
        <AppSubScreenHeader title={selectedJob.title} onBack={() => updateSelectedId(null)} />
        {isAvailable ? (
          <div className="px-5 pb-8">
            <GuardJobCard
              job={selectedJob}
              guard={guard}
              coworkerGuards={coworkerGuards}
              onAccept={onAcceptJob ? () => { onAcceptJob(selectedJob.id); updateSelectedId(null); } : undefined}
              onDeclineDirectJob={
                onDeclineDirectJob && selectedJob.requestType === 'direct'
                  ? () => { void onDeclineDirectJob(selectedJob.id); updateSelectedId(null); }
                  : undefined
              }
              onClose={() => updateSelectedId(null)}
            />
          </div>
        ) : (
          <GuardMyJobDetail
            job={selectedJob}
            guard={guard}
            jobChatThreads={jobChatThreads}
            onOpenMessages={onOpenMessages}
            onApproveOvertime={onApproveOvertime}
          />
        )}
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppSegmentedControl<JobTab>
        options={TAB_OPTIONS}
        value={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'available' && (
        <div className="app-section-body pt-4">
          {availableJobs.length === 0 ? (
            <p className="app-empty-state">No available jobs right now.</p>
          ) : (
            <AppItemCardStack>
              {availableJobs.map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  onSelect={() => updateSelectedId(job.id)}
                  showPay
                />
              ))}
            </AppItemCardStack>
          )}
        </div>
      )}

      {activeTab === 'upcoming' && (
        <div className="app-section-body pt-4">
          {upcomingJobs.length === 0 ? (
            <p className="app-empty-state">No upcoming jobs.</p>
          ) : (
            <AppItemCardStack>
              {upcomingJobs.map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  onSelect={() => updateSelectedId(job.id)}
                  showPay
                />
              ))}
            </AppItemCardStack>
          )}
        </div>
      )}

      {activeTab === 'past' && (
        <div className="app-section-body pt-4">
          {pastJobs.length === 0 ? (
            <p className="app-empty-state">No completed jobs yet.</p>
          ) : (
            <AppItemCardStack>
              {pastJobs.map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  onSelect={() => updateSelectedId(job.id)}
                />
              ))}
            </AppItemCardStack>
          )}
        </div>
      )}
    </AppScreen>
  );
}
