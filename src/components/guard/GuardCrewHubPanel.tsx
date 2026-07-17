import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { GuardStandingCrewMember, SecurityGuard } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { formatShiftRange } from '../../lib/dates';
import { getCrewDisplayName } from '../../lib/guardTeams';
import {
  defaultCrewHubTab,
  getPendingStandingCrewIncoming,
  guardIsInStandingCrew,
  type CrewHubTab,
} from '../../lib/guardStandingCrew';
import { GuardTeamPanel } from './GuardTeamPanel';
import { GuardStandingCrewPanel } from './GuardStandingCrewPanel';
import {
  AppEmptyState,
  AppItemCard,
  AppItemCardStack,
  AppScreen,
  AppSegmentedControl,
  AppSubScreenHeader,
} from '../ui/app/AppPrimitives';
import { MapPin, MessageCircle, Users } from 'lucide-react';
import type { ScheduleJob } from '../../lib/guardSchedule';
import { formatTeamCodeDisplay } from '../../lib/teamCode';
import { useDevice } from '../../lib/platform';
import {
  WorkbenchEmpty,
  WorkbenchPage,
  WorkbenchSplit,
  WorkbenchToolbar,
} from '../baseui/layout/WorkbenchLayout';

export type { CrewHubTab };

interface GuardCrewHubPanelProps {
  guard: SecurityGuard;
  coordinatingJobs: GuardJobView[];
  coworkerGuards: SecurityGuard[];
  standingCrewMembers?: GuardStandingCrewMember[];
  trusted?: boolean;
  scheduleRequests?: ScheduleJob[];
  onInviteGuard?: (jobId: string, guardId: string) => void | Promise<void>;
  onRemoveGuard?: (jobId: string, guardId: string) => void | Promise<void>;
  onUpdateCrewProfile?: (
    jobId: string,
    patch: { crewName: string; crewDescription: string }
  ) => void | Promise<void>;
  onUpdateStandingCrewProfile?: (patch: {
    crewName: string;
    crewDescription: string;
  }) => void | Promise<void>;
  onAcceptInvite?: (jobId: string) => void | Promise<void>;
  onDeclineInvite?: (jobId: string) => void | Promise<void>;
  onInviteStandingCrew?: (guardId: string) => void | Promise<void>;
  onRemoveStandingCrew?: (guardId: string) => void | Promise<void>;
  onAcceptStandingCrewInvite?: (inviteId: string) => void | Promise<void>;
  onDeclineStandingCrewInvite?: (inviteId: string) => void | Promise<void>;
  onRequestCrewLead?: () => void | Promise<void>;
  canRequestCrewLead?: boolean;
  pendingCrewLeadRequest?: boolean;
  onDetailOpenChange?: (open: boolean) => void;
  onJoinTeamWithCode?: (code: string) => void | Promise<void>;
}

function crewJobLabel(job: GuardJobView, guard: SecurityGuard, coworkerGuards: SecurityGuard[]): string {
  const lead = coworkerGuards.find((g) => g.id === job.teamLeadId);
  if (job.teamLeadId === guard.id || job.crewName?.trim()) {
    return getCrewDisplayName(job, lead?.name, lead?.standingCrewName);
  }
  return job.title;
}

function CrewJobListRow({
  job,
  guard,
  coworkerGuards,
  onSelect,
}: {
  job: GuardJobView;
  guard: SecurityGuard;
  coworkerGuards: SecurityGuard[];
  onSelect: () => void;
}) {
  const slotCount = job.guardSlots?.filter((s) => s.guardId).length ?? 0;
  const needed = job.guardsNeeded ?? 1;

  return (
    <AppItemCard onClick={onSelect}>
      <div className="min-w-0 flex-1 text-left">
        <p className="font-semibold truncate">{crewJobLabel(job, guard, coworkerGuards)}</p>
        <p className="text-sm text-brand-text-muted mt-1 truncate">
          {formatShiftRange(job.startDate, job.endDate)}
        </p>
        <p className="text-xs text-brand-text-muted mt-1 flex items-center gap-1 truncate">
          <MapPin className="w-3 h-3 shrink-0" />
          {job.siteName || job.location}
        </p>
        <p className="text-xs font-semibold text-brand-primary mt-1.5">
          {slotCount}/{needed} guards confirmed
          {job.teamCode && job.status === 'open' && (
            <span className="text-brand-text-muted font-normal">
              {' '}
              · Code {formatTeamCodeDisplay(job.teamCode)}
            </span>
          )}
        </p>
      </div>
    </AppItemCard>
  );
}

function CrewJobDetailBody({
  job,
  guard,
  coworkerGuards,
  scheduleRequests,
  onInviteGuard,
  onRemoveGuard,
  onUpdateCrewProfile,
  onAcceptInvite,
  onDeclineInvite,
}: {
  job: GuardJobView;
  guard: SecurityGuard;
  coworkerGuards: SecurityGuard[];
  scheduleRequests?: ScheduleJob[];
  onInviteGuard?: (guardId: string) => void | Promise<void>;
  onRemoveGuard?: (guardId: string) => void | Promise<void>;
  onUpdateCrewProfile?: (patch: {
    crewName: string;
    crewDescription: string;
  }) => void | Promise<void>;
  onAcceptInvite?: () => void | Promise<void>;
  onDeclineInvite?: () => void | Promise<void>;
}) {
  return (
    <div className="space-y-4">
      <div className="app-list-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
        <p className="uber-job-row-meta">{formatShiftRange(job.startDate, job.endDate)}</p>
        <p className="uber-job-row-meta">{job.siteName || job.location}</p>
      </div>
      <GuardTeamPanel
        job={job}
        guard={guard}
        coworkerGuards={coworkerGuards}
        onInviteGuard={onInviteGuard}
        onRemoveGuard={onRemoveGuard}
        onUpdateCrewProfile={onUpdateCrewProfile}
        onAcceptInvite={onAcceptInvite}
        onDeclineInvite={onDeclineInvite}
        scheduleRequests={scheduleRequests}
      />
      <p className="text-xs text-brand-text-muted flex items-center gap-1.5 px-1">
        <MessageCircle className="w-3.5 h-3.5 shrink-0 text-brand-primary" />
        Crew chat is in Messages → Teams.
      </p>
    </div>
  );
}

function CrewJobDetail({
  job,
  guard,
  coworkerGuards,
  scheduleRequests,
  onBack,
  onInviteGuard,
  onRemoveGuard,
  onUpdateCrewProfile,
  onAcceptInvite,
  onDeclineInvite,
}: {
  job: GuardJobView;
  guard: SecurityGuard;
  coworkerGuards: SecurityGuard[];
  scheduleRequests?: ScheduleJob[];
  onBack: () => void;
  onInviteGuard?: (guardId: string) => void | Promise<void>;
  onRemoveGuard?: (guardId: string) => void | Promise<void>;
  onUpdateCrewProfile?: (patch: {
    crewName: string;
    crewDescription: string;
  }) => void | Promise<void>;
  onAcceptInvite?: () => void | Promise<void>;
  onDeclineInvite?: () => void | Promise<void>;
}) {
  const title = crewJobLabel(job, guard, coworkerGuards);

  return (
    <AppScreen className="app-full-page-detail">
      <AppSubScreenHeader title={title} onBack={onBack} />
      <div className="app-section-body px-4 pb-8">
        <CrewJobDetailBody
          job={job}
          guard={guard}
          coworkerGuards={coworkerGuards}
          scheduleRequests={scheduleRequests}
          onInviteGuard={onInviteGuard}
          onRemoveGuard={onRemoveGuard}
          onUpdateCrewProfile={onUpdateCrewProfile}
          onAcceptInvite={onAcceptInvite}
          onDeclineInvite={onDeclineInvite}
        />
      </div>
    </AppScreen>
  );
}

export function GuardCrewHubPanel({
  guard,
  coordinatingJobs,
  coworkerGuards,
  standingCrewMembers = [],
  trusted = false,
  scheduleRequests = [],
  onInviteGuard,
  onRemoveGuard,
  onUpdateCrewProfile,
  onUpdateStandingCrewProfile,
  onAcceptInvite,
  onDeclineInvite,
  onInviteStandingCrew,
  onRemoveStandingCrew,
  onAcceptStandingCrewInvite,
  onDeclineStandingCrewInvite,
  onRequestCrewLead,
  canRequestCrewLead = false,
  pendingCrewLeadRequest = false,
  onDetailOpenChange,
  onJoinTeamWithCode,
}: GuardCrewHubPanelProps) {
  const { formFactor } = useDevice();
  const pendingInvites = useMemo(
    () => getPendingStandingCrewIncoming(standingCrewMembers, guard.id),
    [standingCrewMembers, guard.id]
  );

  const inStandingCrew = useMemo(
    () => guardIsInStandingCrew(guard, standingCrewMembers),
    [guard, standingCrewMembers]
  );

  const tabOptions = useMemo(
    () => [
      { id: 'team' as const, label: 'My team' },
      { id: 'active' as const, label: 'Active' },
    ],
    []
  );

  const [activeTab, setActiveTab] = useState<CrewHubTab>(() =>
    defaultCrewHubTab({
      pendingInviteCount: pendingInvites.length,
      inStandingCrew,
      coordinatingJobCount: coordinatingJobs.length,
    })
  );
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  useEffect(() => {
    onDetailOpenChange?.(selectedJobId != null);
  }, [selectedJobId, onDetailOpenChange]);

  const prevPendingCount = useRef(pendingInvites.length);
  useEffect(() => {
    if (pendingInvites.length > prevPendingCount.current && pendingInvites.length > 0) {
      setActiveTab('team');
    }
    prevPendingCount.current = pendingInvites.length;
  }, [pendingInvites.length]);

  const selectedJob = coordinatingJobs.find((j) => j.id === selectedJobId) ?? null;

  const tabBar = (
    <AppSegmentedControl<CrewHubTab>
      options={tabOptions}
      value={activeTab}
      onChange={setActiveTab}
    />
  );

  const activeTabBody =
    activeTab === 'active' ? (
      <div className="app-section-body pt-4 pb-8 space-y-3">
        <p className="text-xs text-brand-text-muted leading-relaxed px-0.5">
          Jobs where you are coordinating a multi-guard crew. Tap a job to manage members.
        </p>
        {coordinatingJobs.length === 0 ? (
          <AppEmptyState icon={<Users className="w-5 h-5" />} title="No active crews">
            Apply as team lead on a multi-guard job from the map to coordinate your standing team.
          </AppEmptyState>
        ) : (
          <AppItemCardStack>
            {coordinatingJobs.map((job) => (
              <CrewJobListRow
                key={job.id}
                job={job}
                guard={guard}
                coworkerGuards={coworkerGuards}
                onSelect={() => setSelectedJobId(job.id)}
              />
            ))}
          </AppItemCardStack>
        )}
      </div>
    ) : undefined;

  const standingCrewPanelProps = {
    guard,
    members: standingCrewMembers,
    guards: coworkerGuards,
    trusted,
    coordinatingJobs,
    variant: 'embedded' as const,
    afterHero: tabBar,
    embeddedBody: activeTabBody,
    onJoinTeamWithCode,
    onUpdateStandingCrewProfile,
    onInvite: onInviteStandingCrew,
    onRemove: onRemoveStandingCrew,
    onAcceptInvite: onAcceptStandingCrewInvite,
    onDeclineInvite: onDeclineStandingCrewInvite,
    onRequestCrewLead,
    canRequestCrewLead,
    pendingCrewLeadRequest,
  };

  if (formFactor === 'desktop') {
    return (
      <WorkbenchPage className="adm-crew-workbench">
        <WorkbenchToolbar>{tabBar}</WorkbenchToolbar>
        {activeTab === 'active' ? (
          <WorkbenchSplit
            list={
              coordinatingJobs.length === 0 ? (
                <WorkbenchEmpty
                  icon={Users}
                  message="No active crews"
                  action={
                    <p className="uber-workbench-subtitle">
                      Apply as team lead on a multi-guard job from the map.
                    </p>
                  }
                />
              ) : (
                <table className="uber-workbench-table">
                  <thead>
                    <tr>
                      <th>Crew / job</th>
                      <th>When</th>
                      <th>Guards</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coordinatingJobs.map((job) => {
                      const slotCount = job.guardSlots?.filter((s) => s.guardId).length ?? 0;
                      const needed = job.guardsNeeded ?? 1;
                      return (
                        <tr
                          key={job.id}
                          className={`uber-workbench-table-row${selectedJobId === job.id ? ' uber-workbench-table-row--selected' : ''}`}
                          onClick={() => setSelectedJobId(job.id)}
                        >
                          <td>
                            <p className="uber-workbench-table-primary">{crewJobLabel(job, guard, coworkerGuards)}</p>
                            <p className="uber-workbench-table-secondary">{job.siteName || job.location}</p>
                          </td>
                          <td className="uber-workbench-table-secondary">{formatShiftRange(job.startDate, job.endDate)}</td>
                          <td className="uber-workbench-table-secondary">{slotCount}/{needed}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
            }
            detail={
              selectedJob ? (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold m-0">{crewJobLabel(selectedJob, guard, coworkerGuards)}</h2>
                  <CrewJobDetailBody
                    job={selectedJob}
                    guard={guard}
                    coworkerGuards={coworkerGuards}
                    scheduleRequests={scheduleRequests}
                    onInviteGuard={
                      onInviteGuard ? (guardId) => void onInviteGuard(selectedJob.id, guardId) : undefined
                    }
                    onRemoveGuard={
                      onRemoveGuard ? (guardId) => void onRemoveGuard(selectedJob.id, guardId) : undefined
                    }
                    onUpdateCrewProfile={
                      onUpdateCrewProfile
                        ? (patch) => void onUpdateCrewProfile(selectedJob.id, patch)
                        : undefined
                    }
                    onAcceptInvite={
                      onAcceptInvite ? () => void onAcceptInvite(selectedJob.id) : undefined
                    }
                    onDeclineInvite={
                      onDeclineInvite ? () => void onDeclineInvite(selectedJob.id) : undefined
                    }
                  />
                </div>
              ) : (
                <WorkbenchEmpty icon={Users} message="Select a crew job to manage members" variant="detail" />
              )
            }
          />
        ) : (
          <div className="adm-crew-team-workbench">
            <GuardStandingCrewPanel {...standingCrewPanelProps} />
          </div>
        )}
      </WorkbenchPage>
    );
  }

  if (selectedJob) {
    return (
      <CrewJobDetail
        job={selectedJob}
        guard={guard}
        coworkerGuards={coworkerGuards}
        scheduleRequests={scheduleRequests}
        onBack={() => setSelectedJobId(null)}
        onInviteGuard={
          onInviteGuard ? (guardId) => void onInviteGuard(selectedJob.id, guardId) : undefined
        }
        onRemoveGuard={
          onRemoveGuard ? (guardId) => void onRemoveGuard(selectedJob.id, guardId) : undefined
        }
        onUpdateCrewProfile={
          onUpdateCrewProfile
            ? (patch) => void onUpdateCrewProfile(selectedJob.id, patch)
            : undefined
        }
        onAcceptInvite={
          onAcceptInvite ? () => void onAcceptInvite(selectedJob.id) : undefined
        }
        onDeclineInvite={
          onDeclineInvite ? () => void onDeclineInvite(selectedJob.id) : undefined
        }
      />
    );
  }

  return (
    <AppScreen className="crew-hub-screen uber-jobs-screen">
      <GuardStandingCrewPanel {...standingCrewPanelProps} />
    </AppScreen>
  );
}
