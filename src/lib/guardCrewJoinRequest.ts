import type {
  GuardCrewJoinRequest,
  GuardStandingCrewMember,
  SecurityGuard,
} from '../types';
import { isGuardTrusted } from './guardTrust';

export function crewJoinRequestId(guardId: string): string {
  return `cjr-${guardId}`;
}

export function guardIsOnStandingCrew(
  members: GuardStandingCrewMember[],
  guardId: string
): boolean {
  return members.some(
    (m) =>
      m.memberGuardId === guardId && (m.status === 'active' || m.status === 'pending')
  );
}

export function guardLeadsStandingCrew(
  members: GuardStandingCrewMember[],
  guardId: string
): boolean {
  return members.some(
    (m) =>
      m.leadGuardId === guardId && (m.status === 'active' || m.status === 'pending')
  );
}

export function guardHasOwnStandingCrewProfile(guard: SecurityGuard): boolean {
  return !!guard.standingCrewName?.trim();
}

export function getPendingCrewJoinRequest(
  requests: GuardCrewJoinRequest[],
  guardId: string
): GuardCrewJoinRequest | undefined {
  return requests.find((r) => r.guardId === guardId && r.status === 'pending');
}

export function getPendingCrewJoinRequests(
  requests: GuardCrewJoinRequest[]
): GuardCrewJoinRequest[] {
  return requests.filter((r) => r.status === 'pending');
}

export function countPendingCrewJoinRequests(requests: GuardCrewJoinRequest[]): number {
  return getPendingCrewJoinRequests(requests).length;
}

/** Trusted guards without a crew can ask staff to place them on one. */
export function canRequestCrewPlacement(
  guard: SecurityGuard,
  standingCrewMembers: GuardStandingCrewMember[],
  crewJoinRequests: GuardCrewJoinRequest[]
): boolean {
  if (!isGuardTrusted(guard)) return false;
  if (guardIsOnStandingCrew(standingCrewMembers, guard.id)) return false;
  if (guardLeadsStandingCrew(standingCrewMembers, guard.id)) return false;
  if (guardHasOwnStandingCrewProfile(guard)) return false;
  if (getPendingCrewJoinRequest(crewJoinRequests, guard.id)) return false;
  return true;
}

export function submitCrewJoinRequest(
  requests: GuardCrewJoinRequest[],
  guard: SecurityGuard,
  standingCrewMembers: GuardStandingCrewMember[],
  message = '',
  now = new Date()
): { requests: GuardCrewJoinRequest[]; request: GuardCrewJoinRequest } | { error: string } {
  if (!canRequestCrewPlacement(guard, standingCrewMembers, requests)) {
    return {
      error:
        'You already have a crew, are on one, or already have a pending placement request.',
    };
  }
  const request: GuardCrewJoinRequest = {
    id: crewJoinRequestId(guard.id),
    guardId: guard.id,
    status: 'pending',
    message: message.trim() || undefined,
    requestedAt: now.toISOString(),
  };
  const withoutPrior = requests.filter((r) => r.guardId !== guard.id);
  return { requests: [...withoutPrior, request], request };
}

export function approveCrewJoinRequest(
  requests: GuardCrewJoinRequest[],
  requestId: string,
  staffId: string,
  assignedLeadGuardId: string,
  now = new Date()
): { requests: GuardCrewJoinRequest[]; request: GuardCrewJoinRequest } | { error: string } {
  const row = requests.find((r) => r.id === requestId);
  if (!row) return { error: 'Request not found.' };
  if (row.status !== 'pending') return { error: 'This request is no longer pending.' };
  const resolvedAt = now.toISOString();
  const updated: GuardCrewJoinRequest = {
    ...row,
    status: 'approved',
    resolvedAt,
    resolvedByStaffId: staffId,
    assignedLeadGuardId,
  };
  return {
    requests: requests.map((r) => (r.id === requestId ? updated : r)),
    request: updated,
  };
}

export function declineCrewJoinRequest(
  requests: GuardCrewJoinRequest[],
  requestId: string,
  staffId: string,
  now = new Date()
): { requests: GuardCrewJoinRequest[]; request: GuardCrewJoinRequest } | { error: string } {
  const row = requests.find((r) => r.id === requestId);
  if (!row) return { error: 'Request not found.' };
  if (row.status !== 'pending') return { error: 'This request is no longer pending.' };
  const resolvedAt = now.toISOString();
  const updated: GuardCrewJoinRequest = {
    ...row,
    status: 'declined',
    resolvedAt,
    resolvedByStaffId: staffId,
  };
  return {
    requests: requests.map((r) => (r.id === requestId ? updated : r)),
    request: updated,
  };
}

export function makeGuardCrewLeadProfile(
  guard: SecurityGuard
): { standingCrewName: string; standingCrewDescription: string } | { error: string } {
  if (!isGuardTrusted(guard)) {
    return { error: 'Must be a trusted guard to lead a team.' };
  }
  const standingCrewName = guard.standingCrewName?.trim() || `${guard.name}'s Crew`;
  const standingCrewDescription = guard.standingCrewDescription?.trim() || '';
  return { standingCrewName, standingCrewDescription };
}

export function crewJoinRequestRowFromDb(row: Record<string, unknown>): GuardCrewJoinRequest {
  return {
    id: String(row.id),
    guardId: String(row.guard_id),
    status: row.status as GuardCrewJoinRequest['status'],
    message: row.message ? String(row.message) : undefined,
    requestedAt: String(row.requested_at),
    resolvedAt: row.resolved_at ? String(row.resolved_at) : undefined,
    resolvedByStaffId: row.resolved_by_staff_id ? String(row.resolved_by_staff_id) : undefined,
    assignedLeadGuardId: row.assigned_lead_guard_id
      ? String(row.assigned_lead_guard_id)
      : undefined,
  };
}

export function crewJoinRequestRowToDb(request: GuardCrewJoinRequest) {
  return {
    id: request.id,
    guard_id: request.guardId,
    status: request.status,
    message: request.message ?? null,
    requested_at: request.requestedAt,
    resolved_at: request.resolvedAt ?? null,
    resolved_by_staff_id: request.resolvedByStaffId ?? null,
    assigned_lead_guard_id: request.assignedLeadGuardId ?? null,
    updated_at: new Date().toISOString(),
  };
}
