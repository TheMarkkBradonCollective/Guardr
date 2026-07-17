import React, { useEffect, useMemo, useState } from 'react';
import { JobChatThread, SecurityGuard, SessionUser } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { formatShiftRange } from '../../lib/dates';
import { getGuardHourlyPay } from '../../lib/guardJobs';
import type { ScheduleJob } from '../../lib/guardSchedule';
import type { GuardJobsBrowseTab } from '../../lib/guardJobsBrowse';
import { JOB_TALLY_LABELS } from '../../lib/jobTallies';
import { formatTimeUntilShift } from '../../lib/shiftCountdown';
import { Briefcase, Map } from 'lucide-react';
import { GuardJobDetailView } from './GuardJobDetailView';
import {
  WorkbenchEmpty,
  WorkbenchPage,
  WorkbenchSplit,
  WorkbenchStatChips,
  WorkbenchToolbar,
} from '../baseui/layout/WorkbenchLayout';

export interface GuardMyJobsDesktopProps {
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

const TABS: { id: GuardJobsBrowseTab; label: string }[] = [
  { id: 'available', label: JOB_TALLY_LABELS.available },
  { id: 'scheduled', label: JOB_TALLY_LABELS.scheduled },
  { id: 'completed', label: JOB_TALLY_LABELS.completed },
  { id: 'missed', label: JOB_TALLY_LABELS.missed },
];

export function GuardMyJobsDesktop({
  availableJobs,
  scheduledJobs,
  completedJobs,
  missedJobs,
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
  feeConfig,
  onSubmitPriceOffer,
  onAcceptPriceOffer,
  onViewBriefing,
}: GuardMyJobsDesktopProps) {
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

  const jobsByTab: Record<GuardJobsBrowseTab, GuardJobView[]> = {
    available: availableJobs,
    scheduled: scheduledJobs,
    completed: completedJobs,
    missed: missedJobs,
  };

  const listJobs = jobsByTab[activeTab];

  const tallies = useMemo(
    () => ({
      available: availableJobs.length,
      scheduled: scheduledJobs.length,
      completed: completedJobs.length,
      missed: missedJobs.length,
    }),
    [availableJobs.length, scheduledJobs.length, completedJobs.length, missedJobs.length],
  );

  const nextScheduled = useMemo(() => {
    if (scheduledJobs.length === 0) return null;
    return [...scheduledJobs].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    )[0];
  }, [scheduledJobs]);

  const subtitle = useMemo(() => {
    if (nextScheduled) {
      return `Next: ${nextScheduled.title} — ${formatTimeUntilShift(nextScheduled.startDate)}`;
    }
    if (tallies.available > 0) {
      return `${tallies.available} open shift${tallies.available === 1 ? '' : 's'} available.`;
    }
    return 'Browse the map for shifts near you.';
  }, [nextScheduled, tallies.available]);

  const allJobs = useMemo(
    () => [...availableJobs, ...scheduledJobs, ...completedJobs, ...missedJobs],
    [availableJobs, scheduledJobs, completedJobs, missedJobs],
  );
  const selectedJob = allJobs.find((j) => j.id === selectedId) ?? null;

  useEffect(() => {
    if (listJobs.length === 0) {
      if (selectedId) updateSelectedId(null);
      return;
    }
    const stillVisible = selectedId ? listJobs.some((j) => j.id === selectedId) : false;
    if (!stillVisible) updateSelectedId(listJobs[0].id);
  }, [activeTab, listJobs, selectedId]);

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

  return (
    <WorkbenchPage data-tour="guard-my-jobs">
      <WorkbenchToolbar eyebrow="Your shifts" subtitle={subtitle} />

      <WorkbenchStatChips<GuardJobsBrowseTab>
        items={TABS.map(({ id, label }) => ({ id, label, value: tallies[id] }))}
        activeId={activeTab}
        onSelect={setActiveTab}
      />

      <WorkbenchSplit
        list={
          listJobs.length === 0 ? (
            <WorkbenchEmpty icon={Map} message={`No ${JOB_TALLY_LABELS[activeTab].toLowerCase()} shifts`} />
          ) : (
            <table className="uber-workbench-table">
              <thead>
                <tr>
                  <th>Shift</th>
                  <th>Schedule</th>
                  <th>Pay</th>
                </tr>
              </thead>
              <tbody>
                {listJobs.map((job) => (
                  <tr
                    key={job.id}
                    className={`uber-workbench-table-row${selectedId === job.id ? ' uber-workbench-table-row--selected' : ''}`}
                    onClick={() => updateSelectedId(job.id)}
                  >
                    <td>
                      <p className="uber-workbench-table-primary">{job.title}</p>
                      <p className="uber-workbench-table-secondary">{job.siteName || job.location}</p>
                    </td>
                    <td className="uber-workbench-table-secondary">{formatShiftRange(job.startDate, job.endDate)}</td>
                    <td className="uber-workbench-table-value">${getGuardHourlyPay(job)}/hr</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
        detail={
          selectedJob ? (
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
          ) : (
            <WorkbenchEmpty
              icon={Briefcase}
              message="Select a shift to view details and actions"
              variant="detail"
            />
          )
        }
      />
    </WorkbenchPage>
  );
}
