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
    <div className="adm-workbench" data-tour="guard-my-jobs">
      <div className="adm-workbench-toolbar">
        <div>
          <p className="adm-card-eyebrow">Your shifts</p>
          <p className="adm-workbench-subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="adm-workbench-stats">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={`adm-stat-chip${activeTab === id ? ' adm-stat-chip--active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            <span className="adm-stat-chip-value">{tallies[id]}</span>
            <span className="adm-stat-chip-label">{label}</span>
          </button>
        ))}
      </div>

      <div className="adm-workbench-split">
        <div className="adm-workbench-list">
          {listJobs.length === 0 ? (
            <div className="adm-empty">
              <Map className="w-8 h-8 adm-muted-icon" />
              <p>No {JOB_TALLY_LABELS[activeTab].toLowerCase()} shifts</p>
            </div>
          ) : (
            <table className="adm-table adm-table--list">
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
                    className={`adm-table-row--click${selectedId === job.id ? ' adm-table-row--selected' : ''}`}
                    onClick={() => updateSelectedId(job.id)}
                  >
                    <td>
                      <p className="adm-table-primary">{job.title}</p>
                      <p className="adm-table-secondary">{job.siteName || job.location}</p>
                    </td>
                    <td className="adm-table-secondary">{formatShiftRange(job.startDate, job.endDate)}</td>
                    <td className="adm-stat-value adm-stat-value--sm">${getGuardHourlyPay(job)}/hr</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="adm-workbench-detail">
          {selectedJob ? (
            <div className="adm-workbench-detail-inner">
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
            </div>
          ) : (
            <div className="adm-empty adm-empty--detail">
              <Briefcase className="w-10 h-10 adm-muted-icon" />
              <p>Select a shift to view details and actions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
