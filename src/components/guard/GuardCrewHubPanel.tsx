import React from 'react';
import { SecurityGuard } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { formatShiftRange } from '../../lib/dates';
import { getCrewDisplayName } from '../../lib/guardTeams';
import { GuardTeamPanel } from './GuardTeamPanel';
import { AppEmptyState, AppScreen, AppSection } from '../ui/app/AppPrimitives';
import { MapPin, MessageCircle, Users } from 'lucide-react';
import type { ScheduleJob } from '../../lib/guardSchedule';

interface GuardCrewHubPanelProps {
  guard: SecurityGuard;
  coordinatingJobs: GuardJobView[];
  leadOpportunityJobs: GuardJobView[];
  coworkerGuards: SecurityGuard[];
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

function CrewJobCard({
  job,
  guard,
  coworkerGuards,
  scheduleRequests,
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
  const crewLabel = getCrewDisplayName(
    job,
    coworkerGuards.find((g) => g.id === job.teamLeadId)?.name
  );

  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface/40 px-3 py-3 space-y-3">
      <div>
        <p className="font-semibold text-brand-text leading-snug">
          {job.teamLeadId === guard.id || job.crewName?.trim() ? crewLabel : job.title}
        </p>
        <p className="text-xs text-brand-text-muted mt-1">{formatShiftRange(job.startDate, job.endDate)}</p>
        <p className="text-xs text-brand-text-muted mt-0.5 flex items-center gap-1">
          <MapPin className="w-3 h-3 shrink-0" />
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
    </div>
  );
}

export function GuardCrewHubPanel({
  guard,
  coordinatingJobs,
  leadOpportunityJobs,
  coworkerGuards,
  scheduleRequests = [],
  onApplyAsLead,
  onInviteGuard,
  onRemoveGuard,
  onUpdateCrewProfile,
  onAcceptInvite,
  onDeclineInvite,
}: GuardCrewHubPanelProps) {
  return (
    <AppScreen>
      <div className="rounded-xl border border-brand-primary/25 bg-brand-primary/8 px-3 py-3 mb-1 space-y-2">
        <div className="flex items-start gap-2">
          <Users className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-brand-text">Build your crew</p>
            <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">
              Name your crew, invite or remove members, and share your crew code. Clients see your
              crew details when reviewing your team.
            </p>
          </div>
        </div>
        <p className="text-xs text-brand-text-muted flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5 shrink-0 text-brand-primary" />
          Crew chat lives in Messages → Teams.
        </p>
      </div>

      <AppSection title="Your crews">
        {coordinatingJobs.length === 0 ? (
          <AppEmptyState icon={<Users className="w-5 h-5" />} title="No active crews">
            Apply as team lead on an open multi-guard job to start coordinating your crew.
          </AppEmptyState>
        ) : (
          <div className="space-y-3">
            {coordinatingJobs.map((job) => (
              <CrewJobCard
                key={job.id}
                job={job}
                guard={guard}
                coworkerGuards={coworkerGuards}
                scheduleRequests={scheduleRequests}
                onApplyAsLead={
                  onApplyAsLead ? () => void onApplyAsLead(job.id) : undefined
                }
                onInviteGuard={
                  onInviteGuard ? (guardId) => void onInviteGuard(job.id, guardId) : undefined
                }
                onRemoveGuard={
                  onRemoveGuard ? (guardId) => void onRemoveGuard(job.id, guardId) : undefined
                }
                onUpdateCrewProfile={
                  onUpdateCrewProfile
                    ? (patch) => void onUpdateCrewProfile(job.id, patch)
                    : undefined
                }
                onAcceptInvite={
                  onAcceptInvite ? () => void onAcceptInvite(job.id) : undefined
                }
                onDeclineInvite={
                  onDeclineInvite ? () => void onDeclineInvite(job.id) : undefined
                }
              />
            ))}
          </div>
        )}
      </AppSection>

      <AppSection title="Start a crew">
        {leadOpportunityJobs.length === 0 ? (
          <AppEmptyState icon={<MapPin className="w-5 h-5" />} title="No opportunities right now">
            No open multi-guard jobs without a coordinator. Check the map for new offers.
          </AppEmptyState>
        ) : (
          <div className="space-y-3">
            {leadOpportunityJobs.map((job) => (
              <CrewJobCard
                key={job.id}
                job={job}
                guard={guard}
                coworkerGuards={coworkerGuards}
                scheduleRequests={scheduleRequests}
                onApplyAsLead={
                  onApplyAsLead ? () => void onApplyAsLead(job.id) : undefined
                }
                onInviteGuard={
                  onInviteGuard ? (guardId) => void onInviteGuard(job.id, guardId) : undefined
                }
                onRemoveGuard={
                  onRemoveGuard ? (guardId) => void onRemoveGuard(job.id, guardId) : undefined
                }
                onUpdateCrewProfile={
                  onUpdateCrewProfile
                    ? (patch) => void onUpdateCrewProfile(job.id, patch)
                    : undefined
                }
                onAcceptInvite={
                  onAcceptInvite ? () => void onAcceptInvite(job.id) : undefined
                }
                onDeclineInvite={
                  onDeclineInvite ? () => void onDeclineInvite(job.id) : undefined
                }
              />
            ))}
          </div>
        )}
      </AppSection>
    </AppScreen>
  );
}
