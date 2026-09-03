import React, { useMemo } from 'react';
import { SecurityGuard } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { findGuardScheduleConflict, type ScheduleJob } from '../../lib/guardSchedule';
import {
  guardHasJobTeamAssociation,
  isMultiGuardJob,
  teamRosterSummary,
} from '../../lib/guardTeams';
import { guardHasApprovedTeamSlot } from '../../lib/guardTeamFlow';
import { suggestionEligibleForJob } from '../../lib/guardSuggestions';
import { TeamGuardInvitePicker } from './TeamGuardInvitePicker';
import { SuggestGuardPicker } from './SuggestGuardPicker';
import { JobTeamRoster } from '../jobs/JobTeamRoster';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge } from '../ui/wireframe';
import { UserMinus, Users } from 'lucide-react';
import { showAppConfirm } from '../ui/AppConfirm';

interface GuardJobSlotPanelProps {
  job: GuardJobView;
  guard: SecurityGuard;
  coworkerGuards: SecurityGuard[];
  onInviteGuard?: (guardId: string) => void | Promise<void>;
  onRemoveGuard?: (guardId: string) => void | Promise<void>;
  onSuggestGuard?: (guardId: string) => void | Promise<void>;
  onAcceptInvite?: () => void | Promise<void>;
  onDeclineInvite?: () => void | Promise<void>;
  scheduleRequests?: ScheduleJob[];
}

export function GuardJobSlotPanel({
  job,
  guard,
  coworkerGuards,
  onInviteGuard,
  onRemoveGuard,
  onSuggestGuard,
  onAcceptInvite,
  onDeclineInvite,
  scheduleRequests = [],
}: GuardJobSlotPanelProps) {
  const multi = isMultiGuardJob(job);
  const slots = job.guardSlots ?? [];
  const summary = teamRosterSummary(slots, job.guardsNeeded ?? 1);
  const myInvite = slots.find((s) => s.guardId === guard.id && s.status === 'invited');
  const onTeam = guardHasJobTeamAssociation(slots, guard.id);
  const isApproved = guardHasApprovedTeamSlot(slots, guard.id);
  const hasScheduleConflict = !!findGuardScheduleConflict(guard.id, job, scheduleRequests);
  const canInvite = isApproved && summary.open > 0 && job.status === 'open' && !!onInviteGuard;
  const canSuggest =
    job.status === 'open' && suggestionEligibleForJob(job) && !!onSuggestGuard && !hasScheduleConflict;

  const rosterGuards = useMemo(() => {
    const byId = new Map(coworkerGuards.map((g) => [g.id, g]));
    return slots
      .filter((s) => s.guardId)
      .map((s) => ({ slot: s, member: byId.get(s.guardId!) }))
      .filter((row) => row.member);
  }, [coworkerGuards, slots]);

  if (!multi && !canSuggest) return null;

  const handleRemove = async (memberId: string, memberName: string) => {
    if (!onRemoveGuard) return;
    const confirmed = await showAppConfirm({
      title: 'Remove invite?',
      message: `Remove ${memberName} from this job's pending invite?`,
      confirmLabel: 'Remove',
      tone: 'danger',
    });
    if (!confirmed) return;
    await onRemoveGuard(memberId);
  };

  return (
    <div className="space-y-3">
      {multi && (
        <div className="rounded-xl border border-brand-border bg-brand-primary/5 px-3 py-3 space-y-3">
          <div className="flex items-start gap-2">
            <Users className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-brand-text">
                {job.guardsNeeded} guards needed
              </p>
              <p className="text-xs text-brand-text-muted mt-0.5">
                {summary.filled}/{summary.total} approved · {summary.open} open slot
                {summary.open === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          {hasScheduleConflict && job.status === 'open' && !onTeam && (
            <p className="text-xs text-amber-500/95 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2">
              This shift overlaps another job on your schedule.
            </p>
          )}

          {isApproved && (
            <WfBadge tone="primary">You are on this roster — invite teammates below</WfBadge>
          )}

          {myInvite && onAcceptInvite && onDeclineInvite && (
            <div className="space-y-2 rounded-lg border border-brand-primary/30 bg-brand-primary/10 p-3">
              <p className="text-sm font-semibold text-brand-text">Team invitation</p>
              <p className="text-xs text-brand-text-muted">
                You were invited to join this job. Accept to proceed to client approval.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void onAcceptInvite()}
                  className="app-button-primary flex-1 py-2 text-sm"
                >
                  Accept invite
                </button>
                <button
                  type="button"
                  onClick={() => void onDeclineInvite()}
                  className="app-button-outline flex-1 py-2 text-sm text-red-400 border-red-500/40"
                >
                  Decline
                </button>
              </div>
            </div>
          )}

          {canInvite && (
            <TeamGuardInvitePicker
              job={job}
              currentGuardId={guard.id}
              guards={coworkerGuards}
              scheduleRequests={scheduleRequests}
              onInvite={onInviteGuard}
            />
          )}

          {rosterGuards.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
                Roster
              </p>
              {rosterGuards.map(({ slot, member }) => {
                const removable =
                  isApproved &&
                  onRemoveGuard &&
                  slot.invitedByGuardId === guard.id &&
                  slot.status === 'invited';
                return (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-brand-border/80 bg-brand-surface/40 px-2.5 py-2"
                  >
                    <div className="inline-flex items-center gap-2 min-w-0 text-sm text-brand-text">
                      <ProfileAvatar src={member!.avatar} name={member!.name} size="xs" />
                      <span className="truncate">
                        {member!.name}
                        {slot.isLead ? ' · lead' : ''}
                      </span>
                    </div>
                    {removable && (
                      <button
                        type="button"
                        onClick={() => void handleRemove(member!.id, member!.name)}
                        className="app-button-outline app-btn-sm inline-flex items-center gap-1 text-red-400 border-red-500/40 shrink-0"
                      >
                        <UserMinus className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <JobTeamRoster
            job={job}
            guards={coworkerGuards}
            variant="guard"
            currentGuardId={guard.id}
            title="Slot status"
          />
        </div>
      )}

      {canSuggest && (
        <div className="rounded-xl border border-brand-border bg-brand-surface-elevated/40 px-3 py-3">
          <SuggestGuardPicker
            job={job}
            currentGuardId={guard.id}
            guards={coworkerGuards}
            scheduleRequests={scheduleRequests}
            onSuggest={onSuggestGuard}
          />
        </div>
      )}
    </div>
  );
}
