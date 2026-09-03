import React, { useMemo, useState, useEffect } from 'react';
import { JobChatThread, SecurityGuard, SessionUser } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { formatShiftRange } from '../../lib/dates';
import { getGuardHourlyPay } from '../../lib/guardJobs';
import type { ScheduleJob } from '../../lib/guardSchedule';
import type { GuardJobsBrowseTab } from '../../lib/guardJobsBrowse';
import { JOB_TALLY_LABELS } from '../../lib/jobTallies';
import { formatTimeUntilShift } from '../../lib/shiftCountdown';
import { feeConfigFromJobSnapshot } from '../../lib/payments';
import {
  JOBS_PIE_COLORS,
} from '../jobs/JobsScreenHero';
import type { JobsPieSegment } from '../jobs/JobsShiftPieChart';
import {
  AppEmptyState,
  AppItemCard,
  AppItemCardStack,
  AppScreen,
  AppSubScreenHeader,
} from '../ui/app/AppPrimitives';
import { ListFilterTabs } from '../ui/ListFilterTabs';
import { Clock, CheckCircle2, Map, AlertTriangle } from 'lucide-react';
import { useLayoutFormFactor } from '../../surfaces';
import { ListDetailLayout } from '../ui/app/ListDetailLayout';
import { GuardMyJobsDesktop } from './GuardMyJobsDesktop';
import { GuardJobDetailView } from './GuardJobDetailView';

export type { GuardMyJobDetailProps } from './GuardMyJobDetail';
export { GuardMyJobDetail } from './GuardMyJobDetail';

interface GuardMyJobsPanelProps {
  availableJobs: GuardJobView[];
  scheduledJobs: GuardJobView[];
  completedJobs: GuardJobView[];
  missedJobs: GuardJobView[];
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
  onSuggestGuard?: (jobId: string, guardId: string) => void | Promise<void>;
  onRemoveGuard?: (jobId: string, guardId: string) => void | Promise<void>;
  onUpdateCrewProfile?: (
    jobId: string,
    patch: { crewName: string; crewDescription: string }
  ) => void | Promise<void>;
  onAcceptInvite?: (jobId: string) => void | Promise<void>;
  onDeclineInvite?: (jobId: string) => void | Promise<void>;
  feeConfig?: import('../../lib/payments').PlatformFeeConfig;
  onSubmitPriceOffer?: (
    jobId: string,
    input: {
      hourlyRate: number;
      agreementFeeConfig?: import('../../types').AgreementPlatformFeeConfig;
      message?: string;
    }
  ) => void | Promise<void>;
  onAcceptPriceOffer?: (jobId: string, offerId: string) => void | Promise<void>;
  onViewBriefing?: (jobId: string) => void;
}

function JobRow({
  job,
  onSelect,
  showPay = false,
  showTimeUntil = false,
  selected = false,
}: {
  job: GuardJobView;
  onSelect: () => void;
  showPay?: boolean;
  showTimeUntil?: boolean;
  selected?: boolean;
}) {
  const timeUntil = showTimeUntil ? formatTimeUntilShift(job.startDate) : null;
  const pay = showPay ? getGuardHourlyPay(job) : null;
  const statusBadge =
    job.status === 'in-progress' ? 'live' :
    job.status === 'accepted' ? 'scheduled' :
    job.status === 'open' ? 'available' :
    job.status === 'completed' ? 'completed' :
    job.status === 'closed' ? 'past' : 'available';

  return (
    <button type="button" className="uber-job-row" data-selected={selected ? 'true' : undefined} onClick={onSelect}>
      <span className="uber-job-row-icon" aria-hidden>
        <svg width="52" height="32" viewBox="0 0 52 32" fill="none">
          <rect x="4" y="14" width="44" height="14" rx="5" fill="currentColor" opacity="0.12"/>
          <rect x="10" y="8" width="32" height="16" rx="5" fill="currentColor" opacity="0.22"/>
          <circle cx="16" cy="28" r="4" fill="currentColor" opacity="0.55"/>
          <circle cx="36" cy="28" r="4" fill="currentColor" opacity="0.55"/>
        </svg>
      </span>
      <span className="uber-job-row-body">
        <p className="uber-job-row-title">{job.title}</p>
        <p className="uber-job-row-meta">
          {formatShiftRange(job.startDate, job.endDate)}
          {timeUntil ? ` · ${timeUntil}` : ''}
        </p>
      </span>
      <span className="uber-job-row-right">
        {pay != null ? (
          <span className="uber-job-row-price">${pay}/hr</span>
        ) : null}
        <span className={`uber-job-row-badge uber-job-row-badge-${statusBadge}`}>
          {statusBadge === 'live' ? 'Active' :
           statusBadge === 'scheduled' ? 'Scheduled' :
           statusBadge === 'available' ? 'Open' :
           statusBadge === 'completed' || statusBadge === 'past' ? 'Done' : 'Open'}
        </span>
      </span>
    </button>
  );
}

export function GuardMyJobsPanel({
  availableJobs,
  scheduledJobs,
  completedJobs,
  missedJobs,
  guard,
  currentUser,
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
  onSuggestGuard,
  onRemoveGuard,
  onUpdateCrewProfile,
  onAcceptInvite,
  onDeclineInvite,
  feeConfig,
  onSubmitPriceOffer,
  onAcceptPriceOffer,
  onViewBriefing,
}: GuardMyJobsPanelProps) {
  const formFactor = useLayoutFormFactor();
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

  const tallies = useMemo(
    () => ({
      available: availableJobs.length,
      scheduled: scheduledJobs.length,
      completed: completedJobs.length,
      missed: missedJobs.length,
    }),
    [availableJobs.length, scheduledJobs.length, completedJobs.length, missedJobs.length]
  );

  const pieSegments = useMemo<JobsPieSegment[]>(
    () => [
      { id: 'available', label: JOB_TALLY_LABELS.available, value: tallies.available, color: JOBS_PIE_COLORS.available },
      { id: 'scheduled', label: JOB_TALLY_LABELS.scheduled, value: tallies.scheduled, color: JOBS_PIE_COLORS.scheduled },
      { id: 'completed', label: JOB_TALLY_LABELS.completed, value: tallies.completed, color: JOBS_PIE_COLORS.completed },
      { id: 'missed', label: JOB_TALLY_LABELS.missed, value: tallies.missed, color: JOBS_PIE_COLORS.missed },
    ],
    [tallies]
  );

  const tabOptions = useMemo(
    () => [
      { id: 'available' as const, label: JOB_TALLY_LABELS.available },
      { id: 'scheduled' as const, label: JOB_TALLY_LABELS.scheduled },
      { id: 'completed' as const, label: JOB_TALLY_LABELS.completed },
      { id: 'missed' as const, label: JOB_TALLY_LABELS.missed },
    ],
    []
  );

  const jobTotal = tallies.available + tallies.scheduled + tallies.completed + tallies.missed;

  const nextScheduled = useMemo(() => {
    if (scheduledJobs.length === 0) return null;
    return [...scheduledJobs].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    )[0];
  }, [scheduledJobs]);

  const jobsHeroSubtitle = useMemo(() => {
    if (nextScheduled) {
      const timeUntil = formatTimeUntilShift(nextScheduled.startDate);
      return `Next: ${nextScheduled.title} — ${timeUntil}`;
    }
    if (tallies.available > 0) {
      return `${tallies.available} open shift${tallies.available === 1 ? '' : 's'} on the map.`;
    }
    if (jobTotal === 0) {
      return 'Browse the map or check back for new shifts near you.';
    }
    return 'Tap a tab below to browse your shifts.';
  }, [nextScheduled, tallies.available, jobTotal]);

  const allJobs = useMemo(
    () => [...availableJobs, ...scheduledJobs, ...completedJobs, ...missedJobs],
    [availableJobs, scheduledJobs, completedJobs, missedJobs]
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
    onSuggestGuard: onSuggestGuard ? (guardId: string) => void onSuggestGuard(job.id, guardId) : undefined,
    onRemoveGuard: onRemoveGuard ? (guardId: string) => void onRemoveGuard(job.id, guardId) : undefined,
    onUpdateCrewProfile: onUpdateCrewProfile
      ? (patch: { crewName: string; crewDescription: string }) =>
          void onUpdateCrewProfile(job.id, patch)
      : undefined,
    onAcceptInvite: onAcceptInvite ? () => void onAcceptInvite(job.id) : undefined,
    onDeclineInvite: onDeclineInvite ? () => void onDeclineInvite(job.id) : undefined,
    feeConfig: feeConfigFromJobSnapshot({
      hourlyRate: job.hourlyRate ?? 0,
      guardPay: job.guardPay,
      platformFeePerHour: job.hourlyRate != null ? Math.max(0, job.hourlyRate - job.guardPay) : undefined,
    }),
    onSubmitPriceOffer: onSubmitPriceOffer
      ? (input: {
          hourlyRate: number;
          agreementFeeConfig?: import('../../types').AgreementPlatformFeeConfig;
          message?: string;
        }) => void onSubmitPriceOffer(job.id, input)
      : undefined,
    onAcceptPriceOffer: onAcceptPriceOffer
      ? (offerId: string) => void onAcceptPriceOffer(job.id, offerId)
      : undefined,
  });

  const activeJobs =
    activeTab === 'available' ? availableJobs :
    activeTab === 'scheduled' ? scheduledJobs :
    activeTab === 'completed' ? completedJobs :
    missedJobs;

  const emptyIcon =
    activeTab === 'available' ? <Map className="w-6 h-6" /> :
    activeTab === 'scheduled' ? <Clock className="w-6 h-6" /> :
    activeTab === 'completed' ? <CheckCircle2 className="w-6 h-6" /> :
    <AlertTriangle className="w-6 h-6" />;

  const emptyTitle =
    activeTab === 'available' ? 'No open jobs nearby' :
    activeTab === 'scheduled' ? 'No scheduled shifts' :
    activeTab === 'completed' ? 'No completed shifts yet' :
    'No missed shifts';

  const emptyBody =
    activeTab === 'available' ? 'Open jobs in your cities appear here. Use the map to browse.' :
    activeTab === 'scheduled' ? 'Accepted jobs appear here before they start.' :
    activeTab === 'completed' ? 'Your completed shift history will show here.' :
    'No-call and no-show shifts appear here.';

  if (formFactor === 'desktop') {
    return (
      <GuardMyJobsDesktop
        availableJobs={availableJobs}
        scheduledJobs={scheduledJobs}
        completedJobs={completedJobs}
        missedJobs={missedJobs}
        guard={guard}
        currentUser={currentUser}
        jobChatThreads={jobChatThreads}
        selectedJobId={selectedJobIdProp}
        onSelectedJobIdChange={onSelectedJobIdChange}
        activeTab={activeTabProp}
        onActiveTabChange={onActiveTabChange}
        onOpenMessages={onOpenMessages}
        onApproveOvertime={onApproveOvertime}
        onAcceptJob={onAcceptJob}
        onDeclineDirectJob={onDeclineDirectJob}
        coworkerGuards={coworkerGuards}
        scheduleRequests={scheduleRequests}
        onApplyAsLead={onApplyAsLead}
        onInviteGuard={onInviteGuard}
        onSuggestGuard={onSuggestGuard}
        onRemoveGuard={onRemoveGuard}
        onUpdateCrewProfile={onUpdateCrewProfile}
        onAcceptInvite={onAcceptInvite}
        onDeclineInvite={onDeclineInvite}
        feeConfig={feeConfig}
        onSubmitPriceOffer={onSubmitPriceOffer}
        onAcceptPriceOffer={onAcceptPriceOffer}
        onViewBriefing={onViewBriefing}
      />
    );
  }

  if (formFactor === 'tablet') {
    return (
      <AppScreen className="uber-jobs-screen h-full min-h-0">
        <div className="uber-jobs-tab-bar px-4 pt-2">
          <ListFilterTabs
            aria-label="Job status"
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as GuardJobsBrowseTab)}
            tabs={tabOptions.map((tab) => ({
              id: tab.id,
              label: tab.label,
              count: tallies[tab.id],
            }))}
          />
        </div>
        {activeJobs.length === 0 ? (
          <div className="uber-jobs-empty">
            <div className="uber-jobs-empty-icon">{emptyIcon}</div>
            <p className="uber-jobs-empty-title">{emptyTitle}</p>
            <p className="uber-jobs-empty-body">{emptyBody}</p>
          </div>
        ) : (
          <ListDetailLayout
            items={activeJobs}
            selectedId={selectedId}
            onSelectId={updateSelectedId}
            getItemId={(job) => job.id}
            autoSelectFirst
            mobilePresentation="page"
            emptyDetail={
              <div className="sft-empty">
                <p className="sft-empty-title">Select a job</p>
                <p className="sft-empty-message">Choose a shift from the list to review details and actions.</p>
              </div>
            }
            renderItem={(job, isSelected, onSelect) => (
              <JobRow
                job={job}
                onSelect={onSelect}
                selected={isSelected}
                showPay={activeTab === 'available' || activeTab === 'scheduled'}
                showTimeUntil={activeTab === 'scheduled'}
              />
            )}
            renderDetail={(job, options) => (
              <>
                {options?.onBack ? (
                  <AppSubScreenHeader
                    title={job.title}
                    hideTitle
                    onBack={options.onBack}
                    backLabel="My jobs"
                  />
                ) : null}
                <GuardJobDetailView
                  job={job}
                  guard={guard}
                  jobChatThreads={jobChatThreads}
                  coworkerGuards={coworkerGuards}
                  scheduleRequests={scheduleRequests}
                  onOpenMessages={onOpenMessages}
                  onApproveOvertime={onApproveOvertime}
                  onClose={() => updateSelectedId(null)}
                  onViewBriefing={onViewBriefing}
                  {...detailHandlers(job)}
                />
              </>
            )}
          />
        )}
      </AppScreen>
    );
  }

  if (selectedJob) {
    return (
      <AppScreen className="app-full-page-detail">
        <AppSubScreenHeader
          title={selectedJob.title}
          hideTitle
          onBack={() => updateSelectedId(null)}
          backLabel="My jobs"
        />
        <GuardJobDetailView
          job={selectedJob}
          guard={guard}
          jobChatThreads={jobChatThreads}
          coworkerGuards={coworkerGuards}
          scheduleRequests={scheduleRequests}
          onOpenMessages={onOpenMessages}
          onApproveOvertime={onApproveOvertime}
          onClose={() => updateSelectedId(null)}
          onViewBriefing={onViewBriefing}
          {...detailHandlers(selectedJob)}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen className="uber-jobs-screen h-full min-h-0">
      <div className="uber-jobs-tab-bar px-4 pt-2">
        <ListFilterTabs
          aria-label="Job status"
          activeId={activeTab}
          onChange={(id) => setActiveTab(id as GuardJobsBrowseTab)}
          tabs={tabOptions.map((tab) => ({
            id: tab.id,
            label: tab.label,
            count: tallies[tab.id],
          }))}
        />
      </div>

      {/* Job list — job-selection style */}
      <div className="uber-jobs-list">
        {activeJobs.length === 0 ? (
          <div className="uber-jobs-empty">
            <div className="uber-jobs-empty-icon">{emptyIcon}</div>
            <p className="uber-jobs-empty-title">{emptyTitle}</p>
            <p className="uber-jobs-empty-body">{emptyBody}</p>
          </div>
        ) : (
          <>
            <p className="uber-section-header">
              {activeTab === 'available' ? 'Available near you' :
               activeTab === 'scheduled' ? 'Your schedule' :
               activeTab === 'completed' ? 'Shift history' : 'Missed shifts'}
            </p>
            {activeJobs.map((job) => (
              <JobRow
                key={job.id}
                job={job}
                onSelect={() => updateSelectedId(job.id)}
                showPay={activeTab === 'available' || activeTab === 'scheduled'}
                showTimeUntil={activeTab === 'scheduled'}
              />
            ))}
          </>
        )}
      </div>
    </AppScreen>
  );
}
