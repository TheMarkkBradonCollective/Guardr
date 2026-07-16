import type {
  GuardCrewJoinRequest,
  GuardStandingCrewMember,
  SecurityGuard,
} from '../types';
import { isGuardTrusted } from './guardTrust';
import { guardLeadsOwnStandingCrew, guardIsMemberOfStandingCrew } from './guardStandingCrew';

export function crewLeadRequestId(guardId: string): string {
  return `clr-${guardId}`;
}

export function getPendingCrewLeadRequest(
  requests: GuardCrewJoinRequest[],
  guardId: string
): GuardCrewJoinRequest | undefined {
  return requests.find((r) => r.guardId === guardId && r.status === 'pending');
}

export function getPendingCrewLeadRequests(
  requests: GuardCrewJoinRequest[]
): GuardCrewJoinRequest[] {
  return requests.filter((r) => r.status === 'pending');
}

/** Pending requests where the guard still needs staff to set up crew lead status. */
export function getActionableCrewLeadRequests(
  requests: GuardCrewJoinRequest[],
  guards: Pick<SecurityGuard, 'id' | 'name' | 'standingCrewName' | 'standingCrewDescription'>[],
  standingCrewMembers: GuardStandingCrewMember[]
): GuardCrewJoinRequest[] {
  return getPendingCrewLeadRequests(requests).filter((request) => {
    const guard = guards.find((g) => g.id === request.guardId);
    if (!guard) return false;
    return !guardLeadsOwnStandingCrew(guard, standingCrewMembers);
  });
}

export function shouldShowPendingCrewLeadRequest(
  guard: SecurityGuard,
  standingCrewMembers: GuardStandingCrewMember[],
  crewLeadRequests: GuardCrewJoinRequest[]
): boolean {
  if (guardLeadsOwnStandingCrew(guard, standingCrewMembers)) return false;
  return !!getPendingCrewLeadRequest(crewLeadRequests, guard.id);
}

export function countPendingCrewLeadRequests(requests: GuardCrewJoinRequest[]): number {
  return getPendingCrewLeadRequests(requests).length;
}

/** Trusted guards without their own crew can ask staff to set them up as a crew lead. */
export function canRequestCrewLead(
  guard: SecurityGuard,
  standingCrewMembers: GuardStandingCrewMember[],
  crewLeadRequests: GuardCrewJoinRequest[]
): boolean {
  if (!isGuardTrusted(guard)) return false;
  if (guardLeadsOwnStandingCrew(guard, standingCrewMembers)) return false;
  if (guardIsMemberOfStandingCrew(standingCrewMembers, guard.id)) return false;
  if (getPendingCrewLeadRequest(crewLeadRequests, guard.id)) return false;
  return true;
}

export function submitCrewLeadRequest(
  requests: GuardCrewJoinRequest[],
  guard: SecurityGuard,
  standingCrewMembers: GuardStandingCrewMember[],
  message = '',
  now = new Date()
): { requests: GuardCrewJoinRequest[]; request: GuardCrewJoinRequest } | { error: string } {
  if (!canRequestCrewLead(guard, standingCrewMembers, requests)) {
    return {
      error:
        'You already lead a crew, are on another crew, or already have a pending crew lead request.',
    };
  }
  const request: GuardCrewJoinRequest = {
    id: crewLeadRequestId(guard.id),
    guardId: guard.id,
    status: 'pending',
    message: message.trim() || undefined,
    requestedAt: now.toISOString(),
  };
  const withoutPrior = requests.filter((r) => r.guardId !== guard.id);
  return { requests: [...withoutPrior, request], request };
}

export function approveCrewLeadRequest(
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
    status: 'approved',
    resolvedAt,
    resolvedByStaffId: staffId,
  };
  return {
    requests: requests.map((r) => (r.id === requestId ? updated : r)),
    request: updated,
  };
}

export function declineCrewLeadRequest(
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
  guard: SecurityGuard,
  standingCrewMembers: GuardStandingCrewMember[] = []
): { standingCrewName: string; standingCrewDescription: string } | { error: string } {
  if (!isGuardTrusted(guard)) {
    return { error: 'Must be a trusted guard to lead a team.' };
  }
  if (guardIsMemberOfStandingCrew(standingCrewMembers, guard.id)) {
    return { error: 'Leave your current standing crew before leading your own team.' };
  }
  if (guardLeadsOwnStandingCrew(guard, standingCrewMembers)) {
    return {
      standingCrewName: guard.standingCrewName?.trim() || `${guard.name}'s Crew`,
      standingCrewDescription: guard.standingCrewDescription?.trim() || '',
    };
  }
  const standingCrewName = guard.standingCrewName?.trim() || `${guard.name}'s Crew`;
  const standingCrewDescription = guard.standingCrewDescription?.trim() || '';
  return { standingCrewName, standingCrewDescription };
}

export function crewLeadRequestRowFromDb(row: Record<string, unknown>): GuardCrewJoinRequest {
  return {
    id: String(row.id),
    guardId: String(row.guard_id),
    status: row.status as GuardCrewJoinRequest['status'],
    message: row.message ? String(row.message) : undefined,
    requestedAt: String(row.requested_at),
    resolvedAt: row.resolved_at ? String(row.resolved_at) : undefined,
    resolvedByStaffId: row.resolved_by_staff_id ? String(row.resolved_by_staff_id) : undefined,
  };
}

export function crewLeadRequestRowToDb(request: GuardCrewJoinRequest) {
  return {
    id: request.id,
    guard_id: request.guardId,
    status: request.status,
    message: request.message ?? null,
    requested_at: request.requestedAt,
    resolved_at: request.resolvedAt ?? null,
    resolved_by_staff_id: request.resolvedByStaffId ?? null,
    updated_at: new Date().toISOString(),
  };
}

// Backward-compatible aliases for store layer
export const crewJoinRequestRowFromDb = crewLeadRequestRowFromDb;
export const crewJoinRequestRowToDb = crewLeadRequestRowToDb;
export const getPendingCrewJoinRequests = getPendingCrewLeadRequests;
export const countPendingCrewJoinRequests = countPendingCrewLeadRequests;
