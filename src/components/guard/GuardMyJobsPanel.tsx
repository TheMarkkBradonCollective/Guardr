import React, { useMemo, useState, useEffect } from 'react';
import { JobChatThread, SecurityGuard, SessionUser } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { formatShiftRange } from '../../lib/dates';
import { getGuardHourlyPay } from '../../lib/guardJobs';
import type { ScheduleJob } from '../../lib/guardSchedule';
import type { GuardJobsBrowseTab } from '../../lib/guardJobsBrowse';
import { JOB_TALLY_LABELS } from '../../lib/jobTallies';
import { formatTimeUntilShift } from '../../lib/shiftCountdown';
import {
  JobsScreenHero,
  JOBS_PIE_COLORS,
} from '../jobs/JobsScreenHero';
import type { JobsPieSegment } from '../jobs/JobsShiftPieChart';
import {
  AppEmptyState,
  AppItemCard,
  AppItemCardStack,
  AppScreen,
  AppSegmentedControl,
  AppSubScreenHeader,
} from '../ui/app/AppPrimitives';
import { Clock, CheckCircle2, Map, AlertTriangle } from 'lucide-react';
import { useDevice } from '../../lib/platform';
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
  onRemoveGuard,
  onUpdateCrewProfile,
  onAcceptInvite,
  onDeclineInvite,
  feeConfig,
  onSubmitPriceOffer,
  onAcceptPriceOffer,
  onViewBriefing,
}: GuardMyJobsPanelProps) {
  const { formFactor } = useDevice();
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
    onRemoveGuard: onRemoveGuard ? (guardId: string) => void onRemoveGuard(job.id, guardId) : undefined,
    onUpdateCrewProfile: onUpdateCrewProfile
      ? (patch: { crewName: string; crewDescription: string }) =>
          void onUpdateCrewProfile(job.id, patch)
      : undefined,
    onAcceptInvite: onAcceptInvite ? () => void onAcceptInvite(job.id) : undefined,
    onDeclineInvite: onDeclineInvite ? () => void onDeclineInvite(job.id) : undefined,
    feeConfig,
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
          onViewBriefing={onViewBriefing}
          {...detailHandlers(selectedJob)}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen className="guard-tiered-screen h-full min-h-0">
      <div className="guard-tiered-screen-pinned">
        <JobsScreenHero
          eyebrow="Your shifts"
          title="My jobs"
          subtitle={jobsHeroSubtitle}
          segments={pieSegments}
          activeId={activeTab}
          onSegmentSelect={(id) => setActiveTab(id)}
        />
      </div>

      <div className="guard-tiered-screen-toolbar crew-hub-sticky-head guard-jobs-toolbar">
        <AppSegmentedControl<GuardJobsBrowseTab>
          options={tabOptions}
          value={activeTab}
          onChange={setActiveTab}
        />
      </div>

      <div className="guard-tiered-screen-scroll">
        <div className="guard-rating-body">
          {activeTab === 'available' && (
            <div className="app-section-body pt-2">
              {availableJobs.length === 0 ? (
                <AppEmptyState
                  icon={<Map className="w-5 h-5" />}
                  title="No open jobs in your service areas"
                >
                  Open jobs in your cities appear here. Use the map to browse shifts in nearby
                  areas too.
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

          {activeTab === 'scheduled' && (
            <div className="app-section-body pt-2">
              {scheduledJobs.length === 0 ? (
                <AppEmptyState
                  icon={<Clock className="w-5 h-5" />}
                  title="No scheduled shifts"
                >
                  Accepted jobs will appear here before they start.
                </AppEmptyState>
              ) : (
                <AppItemCardStack>
                  {scheduledJobs.map((job) => (
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

          {activeTab === 'completed' && (
            <div className="app-section-body pt-2">
              {completedJobs.length === 0 ? (
                <AppEmptyState
                  icon={<CheckCircle2 className="w-5 h-5" />}
                  title="No completed shifts yet"
                >
                  Your completed shift history will show up here.
                </AppEmptyState>
              ) : (
                <AppItemCardStack>
                  {completedJobs.map((job) => (
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

          {activeTab === 'missed' && (
            <div className="app-section-body pt-2">
              {missedJobs.length === 0 ? (
                <AppEmptyState
                  icon={<AlertTriangle className="w-5 h-5" />}
                  title="No missed shifts"
                >
                  No-call and no-show shifts will appear here.
                </AppEmptyState>
              ) : (
                <AppItemCardStack>
                  {missedJobs.map((job) => (
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
        </div>
      </div>
    </AppScreen>
  );
}
