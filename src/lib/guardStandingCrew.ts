import type { GuardStandingCrewMember, SecurityGuard, StandingCrewMemberStatus } from '../types';
import { isGuardTrusted } from './guardTrust';

export function standingCrewMemberId(leadGuardId: string, memberGuardId: string): string {
  return `sc-${leadGuardId}-${memberGuardId}`;
}

export function isStandingCrewUnread(member: GuardStandingCrewMember): boolean {
  return member.status === 'pending';
}

export function getActiveStandingCrewMembers(
  members: GuardStandingCrewMember[],
  leadGuardId: string
): GuardStandingCrewMember[] {
  return members.filter((m) => m.leadGuardId === leadGuardId && m.status === 'active');
}

export function getPendingStandingCrewOutgoing(
  members: GuardStandingCrewMember[],
  leadGuardId: string
): GuardStandingCrewMember[] {
  return members.filter((m) => m.leadGuardId === leadGuardId && m.status === 'pending');
}

export function getPendingStandingCrewIncoming(
  members: GuardStandingCrewMember[],
  memberGuardId: string
): GuardStandingCrewMember[] {
  return members.filter((m) => m.memberGuardId === memberGuardId && m.status === 'pending');
}

export function guardIsMemberOfStandingCrew(
  members: GuardStandingCrewMember[],
  guardId: string
): boolean {
  return members.some(
    (m) =>
      m.memberGuardId === guardId && (m.status === 'active' || m.status === 'pending')
  );
}

export function guardAlreadyOnStandingCrew(
  members: GuardStandingCrewMember[],
  leadGuardId: string,
  memberGuardId: string
): boolean {
  return members.some(
    (m) =>
      m.leadGuardId === leadGuardId &&
      m.memberGuardId === memberGuardId &&
      (m.status === 'pending' || m.status === 'active')
  );
}

export function inviteToStandingCrew(
  members: GuardStandingCrewMember[],
  lead: SecurityGuard,
  memberGuardId: string,
  now = new Date()
): { members: GuardStandingCrewMember[]; invite: GuardStandingCrewMember } | { error: string } {
  if (!isGuardTrusted(lead)) {
    return { error: 'Only trusted guards can manage a standing crew.' };
  }
  if (lead.id === memberGuardId) {
    return { error: 'You cannot add yourself to your crew.' };
  }
  if (guardAlreadyOnStandingCrew(members, lead.id, memberGuardId)) {
    return { error: 'That guard is already on your crew or has a pending invite.' };
  }
  if (
    members.some(
      (m) =>
        m.memberGuardId === memberGuardId &&
        m.leadGuardId !== lead.id &&
        (m.status === 'pending' || m.status === 'active')
    )
  ) {
    return { error: 'That guard is already on another standing crew.' };
  }
  if (
    members.some(
      (m) =>
        m.leadGuardId === memberGuardId && (m.status === 'pending' || m.status === 'active')
    )
  ) {
    return { error: 'That guard already leads their own standing crew.' };
  }
  const invitedAt = now.toISOString();
  const invite: GuardStandingCrewMember = {
    id: standingCrewMemberId(lead.id, memberGuardId),
    leadGuardId: lead.id,
    memberGuardId,
    status: 'pending',
    invitedAt,
  };
  return { members: [...members, invite], invite };
}

export function acceptStandingCrewInvite(
  members: GuardStandingCrewMember[],
  memberGuardId: string,
  inviteId: string,
  now = new Date()
): { members: GuardStandingCrewMember[]; invite?: GuardStandingCrewMember } | { error: string } {
  const row = members.find((m) => m.id === inviteId);
  if (!row || row.memberGuardId !== memberGuardId) {
    return { error: 'Invitation not found.' };
  }
  if (row.status !== 'pending') {
    return { error: 'This invitation is no longer pending.' };
  }
  const otherCrew = members.find(
    (m) =>
      m.memberGuardId === memberGuardId &&
      m.id !== inviteId &&
      (m.status === 'active' || m.status === 'pending')
  );
  if (otherCrew) {
    return { error: 'You can only be on one standing crew at a time. Leave your current crew first.' };
  }
  const respondedAt = now.toISOString();
  const next = members.map((m) =>
    m.id === inviteId ? { ...m, status: 'active' as StandingCrewMemberStatus, respondedAt } : m
  );
  return { members: next, invite: { ...row, status: 'active', respondedAt } };
}

export function declineStandingCrewInvite(
  members: GuardStandingCrewMember[],
  memberGuardId: string,
  inviteId: string,
  now = new Date()
): { members: GuardStandingCrewMember[] } | { error: string } {
  const row = members.find((m) => m.id === inviteId);
  if (!row || row.memberGuardId !== memberGuardId) {
    return { error: 'Invitation not found.' };
  }
  if (row.status !== 'pending') {
    return { error: 'This invitation is no longer pending.' };
  }
  const respondedAt = now.toISOString();
  return {
    members: members.map((m) =>
      m.id === inviteId ? { ...m, status: 'declined' as StandingCrewMemberStatus, respondedAt } : m
    ),
  };
}

export function removeStandingCrewMember(
  members: GuardStandingCrewMember[],
  leadGuardId: string,
  memberGuardId: string,
  now = new Date()
): { members: GuardStandingCrewMember[] } | { error: string } {
  const row = members.find(
    (m) => m.leadGuardId === leadGuardId && m.memberGuardId === memberGuardId
  );
  if (!row) return { error: 'That guard is not on your crew.' };
  const respondedAt = now.toISOString();
  return {
    members: members.map((m) =>
      m.id === row.id ? { ...m, status: 'removed' as StandingCrewMemberStatus, respondedAt } : m
    ),
  };
}

export function guardLeadsOwnStandingCrew(
  guard: SecurityGuard,
  members: GuardStandingCrewMember[]
): boolean {
  if (guard.standingCrewName?.trim()) return true;
  return members.some(
    (m) =>
      m.leadGuardId === guard.id && (m.status === 'active' || m.status === 'pending')
  );
}

/** Crew codes are only for guards not already tied to a standing crew (as lead or member). */
export function shouldOfferTeamCodeJoin(
  guard: SecurityGuard,
  standingCrewMembers: GuardStandingCrewMember[]
): boolean {
  if (guardLeadsOwnStandingCrew(guard, standingCrewMembers)) return false;
  if (guardIsMemberOfStandingCrew(standingCrewMembers, guard.id)) return false;
  return true;
}

export function listActiveGuardsForStandingCrewInvite(
  guards: SecurityGuard[],
  leadId: string,
  members: GuardStandingCrewMember[],
  query = ''
): SecurityGuard[] {
  const q = query.trim().toLowerCase();
  return guards
    .filter((g) => {
      if (g.id === leadId) return false;
      if (g.userStatus !== 'active' || !g.verified) return false;
      if (guardLeadsOwnStandingCrew(g, members)) return false;
      if (guardIsMemberOfStandingCrew(members, g.id)) return false;
      if (guardAlreadyOnStandingCrew(members, leadId, g.id)) return false;
      if (!q) return true;
      return (
        g.name.toLowerCase().includes(q) ||
        g.badgeNumber.toLowerCase().includes(q) ||
        (g.email ?? '').toLowerCase().includes(q)
      );
    })
    .sort((a, b) => b.rating - a.rating || b.jobsCompleted - a.jobsCompleted);
}

export function standingCrewRowFromDb(row: Record<string, unknown>): GuardStandingCrewMember {
  return {
    id: String(row.id),
    leadGuardId: String(row.lead_guard_id),
    memberGuardId: String(row.member_guard_id),
    status: row.status as StandingCrewMemberStatus,
    invitedAt: String(row.invited_at),
    respondedAt: row.responded_at ? String(row.responded_at) : undefined,
  };
}

export function standingCrewRowToDb(member: GuardStandingCrewMember) {
  return {
    id: member.id,
    lead_guard_id: member.leadGuardId,
    member_guard_id: member.memberGuardId,
    status: member.status,
    invited_at: member.invitedAt,
    responded_at: member.respondedAt ?? null,
    updated_at: new Date().toISOString(),
  };
}
