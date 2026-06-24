import React from 'react';
import { SecurityGuard } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { formatShiftRange } from '../../lib/dates';
import { GuardTeamPanel } from './GuardTeamPanel';
import { AppScreen, AppSection } from '../ui/app/AppPrimitives';
import { MapPin, Users } from 'lucide-react';
import type { ScheduleJob } from '../../lib/guardSchedule';

interface GuardCrewHubPanelProps {
  guard: SecurityGuard;
  coordinatingJobs: GuardJobView[];
  leadOpportunityJobs: GuardJobView[];
  coworkerGuards: SecurityGuard[];
  scheduleRequests?: ScheduleJob[];
  onApplyAsLead?: (jobId: string) => void | Promise<void>;
  onInviteGuard?: (jobId: string, guardId: string) => void | Promise<void>;
  onAcceptInvite?: (jobId: string) => void | Promise<void>;
  onDeclineInvite?: (jobId: string) => void | Promise<void>;
  onOpenTeamChat?: (jobId: string) => void;
}

function CrewJobCard({
  job,
  guard,
  coworkerGuards,
  scheduleRequests,
  onApplyAsLead,
  onInviteGuard,
  onAcceptInvite,
  onDeclineInvite,
  onOpenTeamChat,
}: {
  job: GuardJobView;
  guard: SecurityGuard;
  coworkerGuards: SecurityGuard[];
  scheduleRequests?: ScheduleJob[];
  onApplyAsLead?: () => void | Promise<void>;
  onInviteGuard?: (guardId: string) => void | Promise<void>;
  onAcceptInvite?: () => void | Promise<void>;
  onDeclineInvite?: () => void | Promise<void>;
  onOpenTeamChat?: () => void;
}) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface/40 px-3 py-3 space-y-3">
      <div>
        <p className="font-semibold text-brand-text leading-snug">{job.title}</p>
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
        onAcceptInvite={onAcceptInvite}
        onDeclineInvite={onDeclineInvite}
        onOpenTeamChat={onOpenTeamChat}
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
  onAcceptInvite,
  onDeclineInvite,
  onOpenTeamChat,
}: GuardCrewHubPanelProps) {
  return (
    <AppScreen>
      <div className="rounded-xl border border-brand-primary/25 bg-brand-primary/8 px-3 py-3 mb-1">
        <div className="flex items-start gap-2">
          <Users className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-brand-text">Build your crew</p>
            <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">
              Coordinate multi-guard jobs, invite guards, and share your crew code so they can join
              from Settings.
            </p>
          </div>
        </div>
      </div>

      <AppSection title="Your crews">
        {coordinatingJobs.length === 0 ? (
          <p className="app-empty-state text-sm">
            You are not coordinating a crew yet. Start one on an open multi-guard job below.
          </p>
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
                onAcceptInvite={
                  onAcceptInvite ? () => void onAcceptInvite(job.id) : undefined
                }
                onDeclineInvite={
                  onDeclineInvite ? () => void onDeclineInvite(job.id) : undefined
                }
                onOpenTeamChat={onOpenTeamChat ? () => onOpenTeamChat(job.id) : undefined}
              />
            ))}
          </div>
        )}
      </AppSection>

      <AppSection title="Start a crew">
        {leadOpportunityJobs.length === 0 ? (
          <p className="app-empty-state text-sm">
            No open multi-guard jobs without a coordinator right now. Check the map for new offers.
          </p>
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
                onAcceptInvite={
                  onAcceptInvite ? () => void onAcceptInvite(job.id) : undefined
                }
                onDeclineInvite={
                  onDeclineInvite ? () => void onDeclineInvite(job.id) : undefined
                }
                onOpenTeamChat={onOpenTeamChat ? () => onOpenTeamChat(job.id) : undefined}
              />
            ))}
          </div>
        )}
      </AppSection>
    </AppScreen>
  );
}
