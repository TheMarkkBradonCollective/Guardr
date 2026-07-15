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
import type { GuardJobView } from '../../lib/guardJobView';
import { formatShiftRange } from '../../lib/dates';
import { TeamCodeShareBlock } from './TeamCodeShareBlock';
import { TeamCodeJoinPanel } from './TeamCodeJoinPanel';

interface GuardStandingCrewPanelProps {
  guard: SecurityGuard;
  members: GuardStandingCrewMember[];
  guards: SecurityGuard[];
  trusted: boolean;
  coordinatingJobs?: GuardJobView[];
  variant?: 'default' | 'embedded';
  onJoinTeamWithCode?: (code: string) => void | Promise<void>;
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

function memberDisplay(guards: SecurityGuard[], memberGuardId: string): SecurityGuard {
  return (
    guards.find((g) => g.id === memberGuardId) ?? {
      id: memberGuardId,
      name: 'Guard',
      email: '',
      badgeNumber: memberGuardId.slice(0, 8),
      avatar: '',
      phone: '',
      bio: '',
      isArmed: false,
      backgroundChecked: false,
      verified: false,
      rating: 0,
      jobsCompleted: 0,
      certifications: [],
      experience: [],
    }
  );
}

function crewHeroClass(activeCount: number, pendingCount: number): string {
  if (activeCount >= 4) return 'guard-tier-hero-elite';
  if (activeCount >= 2) return 'guard-tier-hero-professional';
  if (activeCount > 0 || pendingCount > 0) return 'guard-tier-hero-rising';
  return 'guard-tier-hero-starting';
}

function CrewSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="guard-factors-section crew-hub-section">
      <div className="guard-factors-header">
        <h3 className="guard-factors-heading">{title}</h3>
        {description ? <p className="guard-factors-subheading">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function CrewRosterRow({
  member,
  guards,
  pending = false,
  onRemove,
}: {
  member: GuardStandingCrewMember;
  guards: SecurityGuard[];
  pending?: boolean;
  onRemove?: (memberGuardId: string) => void;
}) {
  const profile = memberDisplay(guards, member.memberGuardId);
  const missing = !guards.some((g) => g.id === member.memberGuardId);

  return (
    <li className={`crew-roster-item ${pending ? 'crew-roster-item-pending' : ''}`}>
      <ProfileAvatar src={profile.avatar} name={profile.name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate">
          {pending && missing ? 'Pending invite' : profile.name}
        </p>
        {pending ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500 mt-0.5">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        ) : missing ? (
          <WfBadge tone="warning">Profile unavailable</WfBadge>
        ) : (
          <WfBadge tone="success">Active</WfBadge>
        )}
      </div>
      {!pending && onRemove && (
        <button
          type="button"
          className="app-button-outline app-btn-sm inline-flex items-center gap-1 text-red-400 border-red-500/30 shrink-0"
          onClick={() => void onRemove(member.memberGuardId)}
        >
          <UserMinus className="w-3.5 h-3.5" />
          Remove
        </button>
      )}
    </li>
  );
}

export function GuardStandingCrewPanel({
  guard,
  members,
  guards,
  trusted,
  coordinatingJobs = [],
  variant = 'default',
  onJoinTeamWithCode,
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

  const openCrewCodes = useMemo(
    () =>
      coordinatingJobs.filter(
        (job) => job.status === 'open' && job.teamLeadId === guard.id && job.teamCode
      ),
    [coordinatingJobs, guard.id]
  );

  const isStandingTeamMember = useMemo(
    () =>
      members.some(
        (m) =>
          m.memberGuardId === guard.id && (m.status === 'active' || m.status === 'pending')
      ),
    [members, guard.id]
  );

  const crewDisplayName = getStandingCrewDisplayName(guard);

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
    embedded ? null : <h2 className="app-section-title">{title}</h2>;

  if (!trusted && pendingIncoming.length === 0) {
    return (
      <AppEmptyState icon={<Users className="w-5 h-5" />} title="No team invitations">
        When a trusted guard invites you to their standing crew, it will show up here.
      </AppEmptyState>
    );
  }

  const bodyContent = (
    <>
      {pendingIncoming.length > 0 && (
        <CrewSection title="Invitations" description="Respond to join a standing crew.">
          <ul className="crew-invite-list">
            {pendingIncoming.map((invite) => (
              <li key={invite.id} className="crew-invite-item">
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
        </CrewSection>
      )}

      {trusted && (
        <>
          {onUpdateStandingCrewProfile && (
            <CrewSection
              title="Team profile"
              description="Clients see this on your crew roster and in the Teams directory."
            >
              <CrewDetailsEditor
                jobTitle={crewDisplayName}
                coordinatorName={guard.name}
                crewName={guard.standingCrewName}
                crewDescription={guard.standingCrewDescription}
                editable
                onSave={onUpdateStandingCrewProfile}
              />
            </CrewSection>
          )}

          {openCrewCodes.length > 0 && (
            <CrewSection
              title="Crew codes"
              description="Share a code with guards joining your coordinated crew on an open job."
            >
              <ul className="crew-code-list">
                {openCrewCodes.map((job) => (
                  <li key={job.id}>
                    <TeamCodeShareBlock
                      code={job.teamCode!}
                      title={job.title}
                      subtitle={`${formatShiftRange(job.startDate, job.endDate)} · ${job.siteName || job.location}`}
                    />
                  </li>
                ))}
              </ul>
            </CrewSection>
          )}

          <CrewSection
            title="Standing roster"
            description="Reusable team for future jobs. New members stay pending until they accept."
          >
            {active.length === 0 && pendingOutgoing.length === 0 ? (
              <AppEmptyState icon={<Users className="w-5 h-5" />} title="No members yet">
                Search active guards below to build your team.
              </AppEmptyState>
            ) : (
              <ul className="crew-roster-list">
                {active.map((row) => (
                  <CrewRosterRow
                    key={row.id}
                    member={row}
                    guards={guards}
                    onRemove={onRemove}
                  />
                ))}
                {pendingOutgoing.map((row) => (
                  <CrewRosterRow key={row.id} member={row} guards={guards} pending />
                ))}
              </ul>
            )}
          </CrewSection>

          {onInvite && (
            <CrewSection title="Add guards" description="Search active guards to invite to your standing crew.">
              <WfSearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search active guards…"
                aria-label="Search guards to add to crew"
              />
              <div className="crew-candidate-list">
                {candidates.length === 0 ? (
                  <p className="text-xs text-brand-text-muted px-1 py-4 text-center">
                    No active guards available to add.
                  </p>
                ) : (
                  candidates.map((g) => (
                    <div key={g.id} className="crew-candidate-item">
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
            </CrewSection>
          )}
        </>
      )}

      {!trusted && isStandingTeamMember && onJoinTeamWithCode && (
        <CrewSection
          title="Join a job crew"
          description="Enter a crew code from your coordinator to join their roster on a specific job."
        >
          <TeamCodeJoinPanel onJoin={onJoinTeamWithCode} compact />
        </CrewSection>
      )}
    </>
  );

  if (embedded && trusted) {
    return (
      <section className="guard-rating-section guard-rating-section-tiered guard-crew-screen-card">
        <div className={`guard-tier-hero guard-crew-tier-hero ${crewHeroClass(active.length, pendingOutgoing.length)}`}>
          <div className="guard-tier-hero-glow" aria-hidden />
          <div className="guard-pref-tier-medal" aria-hidden>
            <div className="guard-pref-tier-medal-ring">
              <Users className="guard-pref-tier-medal-icon" />
            </div>
          </div>
          <p className="guard-tier-hero-eyebrow">Standing crew</p>
          <h2 className="guard-tier-hero-name guard-crew-hero-name">{crewDisplayName}</h2>
          <div className="guard-tier-hero-score-row">
            <span className="guard-tier-hero-score-label">Active members</span>
            <span className="guard-tier-hero-score-value">
              {active.length}
              {pendingOutgoing.length > 0 ? (
                <span className="guard-pref-hero-score-total"> +{pendingOutgoing.length} pending</span>
              ) : null}
            </span>
          </div>
          <p className="guard-tier-hero-subtitle">
            {active.length > 0
              ? 'Your standing roster is ready for coordinated jobs.'
              : 'Build your team below — clients see this crew in the Teams directory.'}
          </p>
        </div>
        <div className="guard-rating-body">{bodyContent}</div>
      </section>
    );
  }

  return (
    <div className={embedded ? 'space-y-5' : 'space-y-4'}>
      {!embedded && trusted && sectionTitle('My team')}
      {bodyContent}
    </div>
  );
}
