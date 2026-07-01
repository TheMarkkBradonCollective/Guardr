import React, { useMemo, useState } from 'react';
import { SecurityGuard } from '../../types';
import {
  getActiveStandingCrewMembers,
  getPendingStandingCrewIncoming,
  getPendingStandingCrewOutgoing,
  listActiveGuardsForStandingCrewInvite,
} from '../../lib/guardStandingCrew';
import type { GuardStandingCrewMember } from '../../types';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import { AppEmptyState, AppSection } from '../ui/app/AppPrimitives';
import { WfBadge, WfSearchBar } from '../ui/wireframe';
import { Clock, UserMinus, UserPlus, Users } from 'lucide-react';

interface GuardStandingCrewPanelProps {
  guard: SecurityGuard;
  members: GuardStandingCrewMember[];
  guards: SecurityGuard[];
  trusted: boolean;
  onInvite?: (memberGuardId: string) => void | Promise<void>;
  onRemove?: (memberGuardId: string) => void | Promise<void>;
  onAcceptInvite?: (inviteId: string) => void | Promise<void>;
  onDeclineInvite?: (inviteId: string) => void | Promise<void>;
}

function guardName(guards: SecurityGuard[], id: string): string {
  return guards.find((g) => g.id === id)?.name ?? 'Guard';
}

export function GuardStandingCrewPanel({
  guard,
  members,
  guards,
  trusted,
  onInvite,
  onRemove,
  onAcceptInvite,
  onDeclineInvite,
}: GuardStandingCrewPanelProps) {
  const [search, setSearch] = useState('');
  const [invitingId, setInvitingId] = useState<string | null>(null);

  const active = useMemo(
    () => getActiveStandingCrewMembers(members, guard.id),
    [members, guard.id]
  );
  const pendingOutgoing = useMemo(
    () => getPendingStandingCrewOutgoing(members, guard.id),
    [members, guard.id]
  );
  const pendingIncoming = useMemo(
    () => getPendingStandingCrewIncoming(members, guard.id),
    [members, guard.id]
  );

  const candidates = useMemo(
    () => listActiveGuardsForStandingCrewInvite(guards, guard.id, members, search),
    [guards, guard.id, members, search]
  );

  const handleInvite = async (memberId: string) => {
    if (!onInvite) return;
    setInvitingId(memberId);
    try {
      await onInvite(memberId);
    } finally {
      setInvitingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {pendingIncoming.length > 0 && (
        <AppSection title="Team invitations">
          <ul className="space-y-2">
            {pendingIncoming.map((invite) => (
              <li
                key={invite.id}
                className="rounded-lg border border-brand-primary/35 bg-brand-primary/10 px-3 py-3"
              >
                <p className="text-sm font-semibold text-brand-text">
                  {guardName(guards, invite.leadGuardId)} invited you to their crew
                </p>
                <p className="text-xs text-brand-text-muted mt-1">
                  Accept to be added to their standing team for future jobs.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    type="button"
                    className="app-button-primary app-btn-sm"
                    onClick={() => onAcceptInvite?.(invite.id)}
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    className="app-button-outline app-btn-sm"
                    onClick={() => onDeclineInvite?.(invite.id)}
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </AppSection>
      )}

      {trusted && (
        <>
          <AppSection title="My standing crew">
            <p className="text-xs text-brand-text-muted mb-3 leading-relaxed">
              Build a reusable team from active guards. Pending members must accept before they
              appear as active.
            </p>

            {active.length === 0 && pendingOutgoing.length === 0 ? (
              <AppEmptyState
                icon={<Users className="w-5 h-5" />}
                title="No crew members yet"
              >
                Invite active guards from the list below.
              </AppEmptyState>
            ) : (
              <ul className="divide-y divide-brand-border rounded-lg border border-brand-border overflow-hidden mb-3">
                {active.map((row) => {
                  const member = guards.find((g) => g.id === row.memberGuardId);
                  if (!member) return null;
                  return (
                    <li key={row.id} className="flex items-center gap-3 px-3 py-2.5 bg-brand-surface">
                      <ProfileAvatar src={member.avatar} name={member.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{member.name}</p>
                        <WfBadge tone="success">Active</WfBadge>
                      </div>
                      {onRemove && (
                        <button
                          type="button"
                          className="app-button-outline app-btn-sm inline-flex items-center gap-1 text-red-400 border-red-500/30"
                          onClick={() => void onRemove(row.memberGuardId)}
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          Remove
                        </button>
                      )}
                    </li>
                  );
                })}
                {pendingOutgoing.map((row) => {
                  const member = guards.find((g) => g.id === row.memberGuardId);
                  if (!member) return null;
                  return (
                    <li
                      key={row.id}
                      className="flex items-center gap-3 px-3 py-2.5 bg-brand-primary/6"
                    >
                      <ProfileAvatar src={member.avatar} name={member.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{member.name}</p>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
                          <Clock className="w-3 h-3" />
                          Pending acceptance
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </AppSection>

          {onInvite && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-brand-text-muted">
                Add from active guards
              </label>
              <WfSearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search active guards…"
                aria-label="Search guards to add to crew"
              />
              <div className="max-h-56 overflow-y-auto rounded-lg border border-brand-border bg-brand-surface divide-y divide-brand-border/80">
                {candidates.length === 0 ? (
                  <p className="text-xs text-brand-text-muted px-3 py-4 text-center">
                    No active guards available to add.
                  </p>
                ) : (
                  candidates.map((g) => (
                    <div key={g.id} className="flex items-center gap-3 px-3 py-2.5">
                      <ProfileAvatar src={g.avatar} name={g.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{g.name}</p>
                        <p className="text-xs text-brand-text-muted">#{g.badgeNumber}</p>
                      </div>
                      <button
                        type="button"
                        disabled={invitingId === g.id}
                        onClick={() => void handleInvite(g.id)}
                        className="app-button-primary app-btn-sm inline-flex items-center gap-1 shrink-0"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        {invitingId === g.id ? 'Sending…' : 'Add'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
