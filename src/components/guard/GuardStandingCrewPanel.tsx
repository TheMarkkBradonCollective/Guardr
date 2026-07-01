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
import { AppEmptyState } from '../ui/app/AppPrimitives';
import { WfBadge, WfSearchBar } from '../ui/wireframe';
import { Clock, UserMinus, UserPlus, Users } from 'lucide-react';
import { CrewDetailsEditor } from './CrewDetailsEditor';
import { getStandingCrewDisplayName } from '../../lib/guardTeams';

interface GuardStandingCrewPanelProps {
  guard: SecurityGuard;
  members: GuardStandingCrewMember[];
  guards: SecurityGuard[];
  trusted: boolean;
  variant?: 'default' | 'embedded';
  onUpdateStandingCrewProfile?: (patch: {
    crewName: string;
    crewDescription: string;
  }) => void | Promise<void>;
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
  variant = 'default',
  onUpdateStandingCrewProfile,
  onInvite,
  onRemove,
  onAcceptInvite,
  onDeclineInvite,
}: GuardStandingCrewPanelProps) {
  const [search, setSearch] = useState('');
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const embedded = variant === 'embedded';

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

  const sectionTitle = (title: string) =>
    embedded ? (
      <h2 className="text-xs font-bold uppercase tracking-wide text-brand-text-muted mb-2">{title}</h2>
    ) : (
      <h2 className="app-section-title">{title}</h2>
    );

  if (!trusted && pendingIncoming.length === 0) {
    return (
      <AppEmptyState icon={<Users className="w-5 h-5" />} title="No team invitations">
        When a trusted guard invites you to their standing crew, it will show up here.
      </AppEmptyState>
    );
  }

  return (
    <div className={embedded ? 'space-y-5' : 'space-y-4'}>
      {pendingIncoming.length > 0 && (
        <section>
          {sectionTitle('Invitations')}
          <ul className="space-y-2">
            {pendingIncoming.map((invite) => (
              <li
                key={invite.id}
                className="rounded-lg border border-brand-primary/30 bg-brand-primary/8 px-3 py-3"
              >
                <p className="text-sm font-semibold text-brand-text">
                  {guardName(guards, invite.leadGuardId)} invited you
                </p>
                <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
                  Join their standing team for future coordinated jobs.
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
        </section>
      )}

      {trusted && (
        <>
          {onUpdateStandingCrewProfile && (
            <section>
              {sectionTitle('Team profile')}
              {!embedded && (
                <p className="text-xs text-brand-text-muted mb-3 leading-relaxed">
                  Clients see this in the Teams directory. Your standing roster below is reused on
                  coordinated jobs.
                </p>
              )}
              <CrewDetailsEditor
                jobTitle={getStandingCrewDisplayName(guard)}
                coordinatorName={guard.name}
                crewName={guard.standingCrewName}
                crewDescription={guard.standingCrewDescription}
                editable
                onSave={onUpdateStandingCrewProfile}
              />
            </section>
          )}

          <section>
            {sectionTitle('Standing roster')}
            {!embedded && (
              <p className="text-xs text-brand-text-muted mb-3 leading-relaxed">
                Reusable team for future jobs. New members stay pending until they accept.
              </p>
            )}

            {active.length === 0 && pendingOutgoing.length === 0 ? (
              <AppEmptyState icon={<Users className="w-5 h-5" />} title="No members yet">
                Search active guards below to build your team.
              </AppEmptyState>
            ) : (
              <ul className="divide-y divide-brand-border rounded-lg border border-brand-border overflow-hidden bg-brand-surface/40">
                {active.map((row) => {
                  const member = guards.find((g) => g.id === row.memberGuardId);
                  if (!member) return null;
                  return (
                    <li key={row.id} className="flex items-center gap-3 px-3 py-2.5">
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
                    <li key={row.id} className="flex items-center gap-3 px-3 py-2.5 bg-brand-primary/5">
                      <ProfileAvatar src={member.avatar} name={member.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">{member.name}</p>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {onInvite && (
            <section>
              {sectionTitle('Add guards')}
              <WfSearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search active guards…"
                aria-label="Search guards to add to crew"
              />
              <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-brand-border bg-brand-surface/40 divide-y divide-brand-border/80">
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
            </section>
          )}
        </>
      )}
    </div>
  );
}
