import React, { useMemo, useState } from 'react';
import { SecurityGuard } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { isGuardTrusted } from '../../lib/guardTrust';
import { confirmApplyAsTeamLead } from '../../lib/importantActionConfirm';
import { findGuardScheduleConflict, type ScheduleJob } from '../../lib/guardSchedule';
import { guardHasJobTeamAssociation, isMultiGuardJob, teamRosterSummary } from '../../lib/guardTeams';
import { formatTeamCodeDisplay } from '../../lib/teamCode';
import { TeamGuardInvitePicker } from './TeamGuardInvitePicker';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { showAppToast } from '../ui/AppToast';
import { WfBadge } from '../ui/wireframe';
import { Copy, Users } from 'lucide-react';

interface GuardTeamPanelProps {
  job: GuardJobView;
  guard: SecurityGuard;
  coworkerGuards: SecurityGuard[];
  onApplyAsLead?: () => void | Promise<void>;
  onInviteGuard?: (guardId: string) => void | Promise<void>;
  onAcceptInvite?: () => void | Promise<void>;
  onDeclineInvite?: () => void | Promise<void>;
  onOpenTeamChat?: () => void;
  scheduleRequests?: ScheduleJob[];
}

export function GuardTeamPanel({
  job,
  guard,
  coworkerGuards,
  onApplyAsLead,
  onInviteGuard,
  onAcceptInvite,
  onDeclineInvite,
  onOpenTeamChat,
  scheduleRequests = [],
}: GuardTeamPanelProps) {
  const multi = isMultiGuardJob(job);
  const trusted = isGuardTrusted(guard);
  const slots = job.guardSlots ?? [];
  const summary = teamRosterSummary(slots, job.guardsNeeded ?? 1);
  const isLead = job.teamLeadId === guard.id;
  const myInvite = slots.find((s) => s.guardId === guard.id && s.status === 'invited');
  const onTeam = guardHasJobTeamAssociation(slots, guard.id);
  const hasScheduleConflict = !!findGuardScheduleConflict(guard.id, job, scheduleRequests);
  const canLead = trusted && multi && !job.teamLeadId && job.status === 'open' && !hasScheduleConflict;
  const canInvite = isLead && summary.open > 0 && job.status === 'open';

  const rosterGuards = useMemo(() => {
    const byId = new Map(coworkerGuards.map((g) => [g.id, g]));
    return slots
      .filter((s) => s.guardId)
      .map((s) => ({ slot: s, guard: byId.get(s.guardId!) }))
      .filter((row) => row.guard);
  }, [coworkerGuards, slots]);

  const copyTeamCode = async () => {
    const code = formatTeamCodeDisplay(job.teamCode);
    if (code === '—') return;
    try {
      await navigator.clipboard.writeText(code);
      showAppToast('Team code copied.', { tone: 'success' });
    } catch {
      showAppToast(code, { tone: 'info' });
    }
  };

  if (!multi) return null;

  return (
    <div className="rounded-xl border border-brand-border bg-brand-primary/5 px-3 py-3 space-y-3">
      <div className="flex items-start gap-2">
        <Users className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-brand-text">
            {job.guardsNeeded} guards needed
          </p>
          <p className="text-xs text-brand-text-muted mt-0.5">
            {summary.filled}/{summary.total} confirmed · {summary.open} open slot
            {summary.open === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {!trusted && !onTeam && job.status === 'open' && (
        <p className="text-xs text-brand-text-muted">
          Trusted guards can coordinate crews and skip Guardr review on Stripe jobs. Cash jobs always go through staff. To join an existing crew, enter the crew code in Settings or accept a coordinator invite.
        </p>
      )}

      {hasScheduleConflict && job.status === 'open' && !onTeam && (
        <p className="text-xs text-amber-500/95 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2">
          This shift overlaps another job on your schedule. You cannot join until those times are clear.
        </p>
      )}

      {canLead && onApplyAsLead && (
        <button
          type="button"
          onClick={() => {
            void (async () => {
              if (!(await confirmApplyAsTeamLead(job.title))) return;
              await onApplyAsLead();
            })();
          }}
          className="app-button-primary w-full py-2.5 text-sm font-bold"
        >
          Apply as crew coordinator
        </button>
      )}

      {isLead && (
        <WfBadge tone="primary">You are the crew coordinator</WfBadge>
      )}

      {isLead && job.teamCode && job.status === 'open' && (
        <div className="rounded-lg border border-brand-primary/25 bg-brand-primary/10 px-3 py-2.5 space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
            Crew team code
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-base font-bold tracking-widest text-brand-primary">
              {formatTeamCodeDisplay(job.teamCode)}
            </code>
            <button
              type="button"
              onClick={() => void copyTeamCode()}
              className="app-button-outline app-btn-sm inline-flex items-center gap-1 shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy
            </button>
          </div>
          <p className="text-xs text-brand-text-muted">
            Share this code so guards can join your coordinated crew from Settings.
          </p>
        </div>
      )}

      {onTeam && onOpenTeamChat && job.status !== 'closed' && (
        <button type="button" onClick={onOpenTeamChat} className="app-button-outline w-full py-2.5 text-sm">
          Open team chat
        </button>
      )}

      {myInvite && onAcceptInvite && onDeclineInvite && (
        <div className="space-y-2 rounded-lg border border-brand-primary/30 bg-brand-primary/10 p-3">
          <p className="text-sm font-semibold text-brand-text">Team invitation</p>
          <p className="text-xs text-brand-text-muted">
            {job.teamLeadId
              ? 'You were invited to join this crew. Accept to proceed to client approval.'
              : 'You have a pending team invitation.'}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => void onAcceptInvite()} className="app-button-primary flex-1 py-2 text-sm">
              Accept invite
            </button>
            <button type="button" onClick={() => void onDeclineInvite()} className="app-button-outline flex-1 py-2 text-sm text-red-400 border-red-500/40">
              Decline
            </button>
          </div>
        </div>
      )}

      {canInvite && onInviteGuard && (
        <TeamGuardInvitePicker
          job={job}
          leadId={guard.id}
          guards={coworkerGuards}
          scheduleRequests={scheduleRequests}
          onInvite={onInviteGuard}
        />
      )}

      {!onTeam && !myInvite && summary.open > 0 && job.status === 'open' && !!job.teamLeadId && (
        <p className="text-xs text-brand-text-muted">
          This job has a coordinated crew. Enter the crew code in Settings or wait for a coordinator invite. To work this job independently, use Apply on the job card.
        </p>
      )}

      {!onTeam && !myInvite && summary.open > 0 && job.status === 'open' && !job.teamLeadId && (
        <p className="text-xs text-brand-text-muted">
          No crew coordinator yet. Tap Apply on this job to request independently, or wait for a trusted guard to start a coordinated crew.
        </p>
      )}

      {rosterGuards.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {rosterGuards.map(({ slot, guard: member }) => (
            <div key={slot.id} className="inline-flex items-center gap-1.5 text-xs text-brand-text-muted">
              <ProfileAvatar src={member!.avatar} name={member!.name} size="xs" />
              {member!.name}
              {slot.isLead ? ' · coordinator' : ''}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
