import React, { useMemo, useState, useEffect } from 'react';
import { JobChatThread, SecurityGuard, SessionUser } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { formatShiftRange } from '../../lib/dates';
import { getGuardHourlyPay } from '../../lib/guardJobs';
import type { ScheduleJob } from '../../lib/guardSchedule';
import type { GuardJobsBrowseTab } from '../../lib/guardJobsBrowse';
import {
  AppEmptyState,
  AppItemCard,
  AppItemCardStack,
  AppScreen,
  AppSegmentedControl,
  AppSubScreenHeader,
} from '../ui/app/AppPrimitives';
import { Briefcase, Clock, CheckCircle2, Map } from 'lucide-react';
import { GuardJobDetailView } from './GuardJobDetailView';

/** Format time until a shift in a human-friendly way. */
function formatTimeUntilShift(startDate: string): string {
  const now = new Date();
  const start = new Date(startDate);
  const diffMs = start.getTime() - now.getTime();
  if (diffMs <= 0) return 'Now';
  const diffHours = diffMs / 3_600_000;
  if (diffHours < 1) {
    const mins = Math.round(diffMs / 60_000);
    return `In ${mins} min${mins === 1 ? '' : 's'}`;
  }
  if (diffHours < 24) {
    const hours = Math.floor(diffHours);
    const mins = Math.round((diffHours - hours) * 60);
    return mins > 0 ? `In ${hours}h ${mins}m` : `In ${hours}h`;
  }
  // > 24 hours — show date + time
  return start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
    ' at ' + start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export type { GuardMyJobDetailProps } from './GuardMyJobDetail';
export { GuardMyJobDetail } from './GuardMyJobDetail';

interface GuardMyJobsPanelProps {
  availableJobs: GuardJobView[];
  upcomingJobs: GuardJobView[];
  pastJobs: GuardJobView[];
  guard: SecurityGuard;
  currentUser: SessionUser;
  jobChatThreads?: JobChatThread[];
  selectedJobId?: string | null;
  onSelectedJobIdChange?: (jobId: string | null) => void;
  activeTab?: GuardJobsBrowseTab;
  onActiveTabChange?: (tab: GuardJobsBrowseTab) => void;
  onOpenMessages?: (jobId: string) => void;
  onApproveOvertime?: (requestId: string) => void | Promise<void>;
  onAcceptJob?: (jobId: string) => void;
  onDeclineDirectJob?: (jobId: string) => void | Promise<void>;
  coworkerGuards?: SecurityGuard[];
  scheduleRequests?: ScheduleJob[];
  onApplyAsLead?: (jobId: string) => void | Promise<void>;
  onInviteGuard?: (jobId: string, guardId: string) => void | Promise<void>;
  onRemoveGuard?: (jobId: string, guardId: string) => void | Promise<void>;
  onUpdateCrewProfile?: (
    jobId: string,
    patch: { crewName: string; crewDescription: string }
  ) => void | Promise<void>;
  onAcceptInvite?: (jobId: string) => void | Promise<void>;
  onDeclineInvite?: (jobId: string) => void | Promise<void>;
}

function JobRow({
  job,
  onSelect,
  showPay = false,
  showTimeUntil = false,
}: {
  job: GuardJobView;
  onSelect: () => void;
  showPay?: boolean;
  showTimeUntil?: boolean;
}) {
  const timeUntil = showTimeUntil ? formatTimeUntilShift(job.startDate) : null;

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
        {timeUntil && (
          <p className="text-xs font-semibold text-brand-primary flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3 shrink-0" />
            {timeUntil}
          </p>
        )}
        {showPay && (
          <p className="text-sm font-medium text-brand-primary mt-1">
            ${getGuardHourlyPay(job)}/hr
          </p>
        )}
      </div>
    </AppItemCard>
  );
}

const TAB_OPTIONS: { id: GuardJobsBrowseTab; label: string }[] = [
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
  selectedJobId: selectedJobIdProp,
  onSelectedJobIdChange,
  activeTab: activeTabProp,
  onActiveTabChange,
  onOpenMessages,
  onApproveOvertime,
  onAcceptJob,
  onDeclineDirectJob,
  coworkerGuards,
  scheduleRequests,
  onApplyAsLead,
  onInviteGuard,
  onRemoveGuard,
  onUpdateCrewProfile,
  onAcceptInvite,
  onDeclineInvite,
}: GuardMyJobsPanelProps) {
  const [internalTab, setInternalTab] = useState<GuardJobsBrowseTab>('available');
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);

  const activeTab = activeTabProp ?? internalTab;
  const selectedId = selectedJobIdProp !== undefined ? selectedJobIdProp : internalSelectedId;

  const setActiveTab = (tab: GuardJobsBrowseTab) => {
    if (activeTabProp === undefined) setInternalTab(tab);
    onActiveTabChange?.(tab);
  };

  const updateSelectedId = (jobId: string | null) => {
    if (selectedJobIdProp === undefined) setInternalSelectedId(jobId);
    onSelectedJobIdChange?.(jobId);
  };

  useEffect(() => {
    if (selectedJobIdProp !== undefined) {
      setInternalSelectedId(selectedJobIdProp);
    }
  }, [selectedJobIdProp]);

  useEffect(() => {
    if (activeTabProp !== undefined) {
      setInternalTab(activeTabProp);
    }
  }, [activeTabProp]);

  const allJobs = useMemo(
    () => [...availableJobs, ...upcomingJobs, ...pastJobs],
    [availableJobs, upcomingJobs, pastJobs]
  );
  const selectedJob = allJobs.find((j) => j.id === selectedId) ?? null;

  const detailHandlers = (job: GuardJobView) => ({
    onAccept: onAcceptJob ? () => { onAcceptJob(job.id); updateSelectedId(null); } : undefined,
    onDeclineDirectJob:
      onDeclineDirectJob && job.requestType === 'direct'
        ? () => { void onDeclineDirectJob(job.id); updateSelectedId(null); }
        : undefined,
    onApplyAsLead: onApplyAsLead ? () => void onApplyAsLead(job.id) : undefined,
    onInviteGuard: onInviteGuard ? (guardId: string) => void onInviteGuard(job.id, guardId) : undefined,
    onRemoveGuard: onRemoveGuard ? (guardId: string) => void onRemoveGuard(job.id, guardId) : undefined,
    onUpdateCrewProfile: onUpdateCrewProfile
      ? (patch: { crewName: string; crewDescription: string }) =>
          void onUpdateCrewProfile(job.id, patch)
      : undefined,
    onAcceptInvite: onAcceptInvite ? () => void onAcceptInvite(job.id) : undefined,
    onDeclineInvite: onDeclineInvite ? () => void onDeclineInvite(job.id) : undefined,
  });

  if (selectedJob) {
    return (
      <AppScreen className="app-full-page-detail">
        <AppSubScreenHeader title={selectedJob.title} onBack={() => updateSelectedId(null)} />
        <GuardJobDetailView
          job={selectedJob}
          guard={guard}
          jobChatThreads={jobChatThreads}
          coworkerGuards={coworkerGuards}
          scheduleRequests={scheduleRequests}
          onOpenMessages={onOpenMessages}
          onApproveOvertime={onApproveOvertime}
          onClose={() => updateSelectedId(null)}
          {...detailHandlers(selectedJob)}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppSegmentedControl<GuardJobsBrowseTab>
        options={TAB_OPTIONS}
        value={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'available' && (
        <div className="app-section-body pt-4">
          {availableJobs.length === 0 ? (
            <AppEmptyState
              icon={<Map className="w-5 h-5" />}
              title="No open jobs right now"
            >
              Check the map to browse available shifts near you.
            </AppEmptyState>
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
            <AppEmptyState
              icon={<Clock className="w-5 h-5" />}
              title="No upcoming shifts"
            >
              Accepted jobs will appear here before they start.
            </AppEmptyState>
          ) : (
            <AppItemCardStack>
              {upcomingJobs.map((job) => (
                <JobRow
                  key={job.id}
                  job={job}
                  onSelect={() => updateSelectedId(job.id)}
                  showPay
                  showTimeUntil
                />
              ))}
            </AppItemCardStack>
          )}
        </div>
      )}

      {activeTab === 'past' && (
        <div className="app-section-body pt-4">
          {pastJobs.length === 0 ? (
            <AppEmptyState
              icon={<CheckCircle2 className="w-5 h-5" />}
              title="No completed shifts yet"
            >
              Your shift history will show up here after you complete jobs.
            </AppEmptyState>
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
