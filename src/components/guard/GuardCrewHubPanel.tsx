import React, { useEffect, useMemo, useState } from 'react';
import type { GuardStandingCrewMember, SecurityGuard } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { formatShiftRange } from '../../lib/dates';
import { getCrewDisplayName } from '../../lib/guardTeams';
import { getPendingStandingCrewIncoming } from '../../lib/guardStandingCrew';
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
import { MapPin, MessageCircle, Sparkles, Users } from 'lucide-react';
import type { ScheduleJob } from '../../lib/guardSchedule';

export type CrewHubTab = 'team' | 'active' | 'start';

interface GuardCrewHubPanelProps {
  guard: SecurityGuard;
  coordinatingJobs: GuardJobView[];
  leadOpportunityJobs: GuardJobView[];
  coworkerGuards: SecurityGuard[];
  standingCrewMembers?: GuardStandingCrewMember[];
  trusted?: boolean;
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
  onInviteStandingCrew?: (guardId: string) => void | Promise<void>;
  onRemoveStandingCrew?: (guardId: string) => void | Promise<void>;
  onAcceptStandingCrewInvite?: (inviteId: string) => void | Promise<void>;
  onDeclineStandingCrewInvite?: (inviteId: string) => void | Promise<void>;
}

function crewJobLabel(job: GuardJobView, guard: SecurityGuard, coworkerGuards: SecurityGuard[]): string {
  const leadName = coworkerGuards.find((g) => g.id === job.teamLeadId)?.name;
  if (job.teamLeadId === guard.id || job.crewName?.trim()) {
    return getCrewDisplayName(job, leadName);
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
        </p>
      </div>
    </AppItemCard>
  );
}

function CrewJobDetail({
  job,
  guard,
  coworkerGuards,
  scheduleRequests,
  onBack,
  onApplyAsLead,
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
  onApplyAsLead?: () => void | Promise<void>;
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
      <div className="app-section-body px-4 pb-8 space-y-4">
        <div className="rounded-lg border border-brand-border bg-brand-surface/50 px-3 py-3">
          <p className="text-sm text-brand-text-muted">{formatShiftRange(job.startDate, job.endDate)}</p>
          <p className="text-xs text-brand-text-muted mt-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            {job.siteName || job.location}
          </p>
        </div>
        <GuardTeamPanel
          job={job}
          guard={guard}
          coworkerGuards={coworkerGuards}
          onApplyAsLead={onApplyAsLead}
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
    </AppScreen>
  );
}

function tabLabel(base: string, count: number): string {
  return count > 0 ? `${base} (${count})` : base;
}

export function GuardCrewHubPanel({
  guard,
  coordinatingJobs,
  leadOpportunityJobs,
  coworkerGuards,
  standingCrewMembers = [],
  trusted = false,
  scheduleRequests = [],
  onApplyAsLead,
  onInviteGuard,
  onRemoveGuard,
  onUpdateCrewProfile,
  onAcceptInvite,
  onDeclineInvite,
  onInviteStandingCrew,
  onRemoveStandingCrew,
  onAcceptStandingCrewInvite,
  onDeclineStandingCrewInvite,
}: GuardCrewHubPanelProps) {
  const pendingInvites = useMemo(
    () => getPendingStandingCrewIncoming(standingCrewMembers, guard.id),
    [standingCrewMembers, guard.id]
  );

  const tabOptions = useMemo(() => {
    const opts: { id: CrewHubTab; label: string }[] = [
      { id: 'team', label: tabLabel('My team', pendingInvites.length) },
      { id: 'active', label: tabLabel('Active', coordinatingJobs.length) },
    ];
    if (trusted) {
      opts.push({ id: 'start', label: tabLabel('Start', leadOpportunityJobs.length) });
    }
    return opts;
  }, [pendingInvites.length, coordinatingJobs.length, leadOpportunityJobs.length, trusted]);

  const [activeTab, setActiveTab] = useState<CrewHubTab>(() =>
    pendingInvites.length > 0 ? 'team' : coordinatingJobs.length > 0 ? 'active' : 'team'
  );
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!tabOptions.some((t) => t.id === activeTab)) {
      setActiveTab(tabOptions[0]?.id ?? 'team');
    }
  }, [activeTab, tabOptions]);

  const allJobs = useMemo(
    () => [...coordinatingJobs, ...leadOpportunityJobs],
    [coordinatingJobs, leadOpportunityJobs]
  );
  const selectedJob = allJobs.find((j) => j.id === selectedJobId) ?? null;

  if (selectedJob) {
    const isLeadOpp = leadOpportunityJobs.some((j) => j.id === selectedJob.id);
    return (
      <CrewJobDetail
        job={selectedJob}
        guard={guard}
        coworkerGuards={coworkerGuards}
        scheduleRequests={scheduleRequests}
        onBack={() => setSelectedJobId(null)}
        onApplyAsLead={
          onApplyAsLead && isLeadOpp ? () => void onApplyAsLead(selectedJob.id) : undefined
        }
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
    <AppScreen className="crew-hub-screen">
      <div className="crew-hub-sticky-head">
        <AppSegmentedControl<CrewHubTab>
          options={tabOptions}
          value={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {activeTab === 'team' && (
        <div className="app-section-body pt-4 pb-8">
          <GuardStandingCrewPanel
            guard={guard}
            members={standingCrewMembers}
            guards={coworkerGuards}
            trusted={trusted}
            variant="embedded"
            onInvite={onInviteStandingCrew}
            onRemove={onRemoveStandingCrew}
            onAcceptInvite={onAcceptStandingCrewInvite}
            onDeclineInvite={onDeclineStandingCrewInvite}
          />
        </div>
      )}

      {activeTab === 'active' && (
        <div className="app-section-body pt-4 pb-8 space-y-3">
          <p className="text-xs text-brand-text-muted leading-relaxed px-0.5">
            Jobs where you are coordinating a multi-guard crew. Tap a job to manage members and crew
            details.
          </p>
          {coordinatingJobs.length === 0 ? (
            <AppEmptyState icon={<Users className="w-5 h-5" />} title="No active crews">
              Apply as team lead on a multi-guard job to start building your crew.
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
      )}

      {activeTab === 'start' && trusted && (
        <div className="app-section-body pt-4 pb-8 space-y-3">
          <p className="text-xs text-brand-text-muted leading-relaxed px-0.5">
            Open multi-guard jobs without a coordinator. Apply as lead and invite your standing team.
          </p>
          {leadOpportunityJobs.length === 0 ? (
            <AppEmptyState icon={<Sparkles className="w-5 h-5" />} title="No opportunities right now">
              Check the map for new multi-guard jobs you can lead.
            </AppEmptyState>
          ) : (
            <AppItemCardStack>
              {leadOpportunityJobs.map((job) => (
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
      )}
    </AppScreen>
  );
}
