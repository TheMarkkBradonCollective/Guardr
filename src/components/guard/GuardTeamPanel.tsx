import React, { useMemo, useState } from 'react';
import { SecurityGuard } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { isGuardTrusted } from '../../lib/guardTrust';
import { guardHasJobTeamAssociation, isMultiGuardJob, teamRosterSummary } from '../../lib/guardTeams';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { WfBadge } from '../ui/wireframe';
import { Users } from 'lucide-react';

interface GuardTeamPanelProps {
  job: GuardJobView;
  guard: SecurityGuard;
  coworkerGuards: SecurityGuard[];
  onApplyAsLead?: () => void | Promise<void>;
  onApplyOpenSlot?: () => void | Promise<void>;
  onInviteGuard?: (guardId: string) => void | Promise<void>;
  onAcceptInvite?: () => void | Promise<void>;
  onDeclineInvite?: () => void | Promise<void>;
}

export function GuardTeamPanel({
  job,
  guard,
  coworkerGuards,
  onApplyAsLead,
  onApplyOpenSlot,
  onInviteGuard,
  onAcceptInvite,
  onDeclineInvite,
}: GuardTeamPanelProps) {
  const [inviteGuardId, setInviteGuardId] = useState('');
  const multi = isMultiGuardJob(job);
  const trusted = isGuardTrusted(guard);
  const slots = job.guardSlots ?? [];
  const summary = teamRosterSummary(slots, job.guardsNeeded ?? 1);
  const isLead = job.teamLeadId === guard.id;
  const myInvite = slots.find((s) => s.guardId === guard.id && s.status === 'invited');
  const onTeam = guardHasJobTeamAssociation(slots, guard.id);
  const canLead = trusted && multi && !job.teamLeadId && job.status === 'open';
  const canInvite = isLead && summary.open > 0 && job.status === 'open';

  const inviteCandidates = useMemo(() => {
    const taken = new Set(slots.map((s) => s.guardId).filter(Boolean) as string[]);
    return coworkerGuards.filter(
      (g) => g.id !== guard.id && !taken.has(g.id) && g.userStatus === 'active' && g.verified
    );
  }, [coworkerGuards, guard.id, slots]);

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
          Trusted guards can lead a team and invite crew. You can still apply for an open slot.
        </p>
      )}

      {canLead && onApplyAsLead && (
        <button type="button" onClick={() => void onApplyAsLead()} className="app-button-primary w-full py-2.5 text-sm font-bold">
          Apply as team lead
        </button>
      )}

      {isLead && (
        <WfBadge tone="primary">You are the team lead</WfBadge>
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
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
            Invite a guard
          </label>
          <div className="flex gap-2">
            <select
              value={inviteGuardId}
              onChange={(e) => setInviteGuardId(e.target.value)}
              className="app-input flex-1 text-sm"
            >
              <option value="">Select guard…</option>
              {inviteCandidates.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!inviteGuardId}
              onClick={() => {
                void onInviteGuard(inviteGuardId);
                setInviteGuardId('');
              }}
              className="app-button-primary app-btn-sm shrink-0"
            >
              Invite
            </button>
          </div>
          {inviteCandidates.length === 0 && (
            <p className="text-xs text-brand-text-muted">No available guards to invite right now.</p>
          )}
        </div>
      )}

      {!onTeam && !myInvite && summary.open > 0 && job.status === 'open' && onApplyOpenSlot && (
        <button type="button" onClick={() => void onApplyOpenSlot()} className="app-button-outline w-full py-2.5 text-sm">
          Apply for open slot
        </button>
      )}

      {slots.some((s) => s.guardId && s.guardId !== guard.id) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {slots
            .filter((s) => s.guardId)
            .map((s) => {
              const g = coworkerGuards.find((c) => c.id === s.guardId);
              if (!g) return null;
              return (
                <div key={s.id} className="inline-flex items-center gap-1.5 text-xs text-brand-text-muted">
                  <ProfileAvatar src={g.avatar} name={g.name} size="xs" />
                  {g.name}
                  {s.isLead ? ' · lead' : ''}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
