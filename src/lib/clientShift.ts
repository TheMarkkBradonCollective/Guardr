import { SecurityGuard, SecurityRequest } from '../types';
import { computeHoursWorkedLabel } from './clientCoverage';
import { formatShiftRange } from './dates';

export type ClientShiftPhase = 'scheduled' | 'en-route' | 'on-site' | 'on-duty' | 'complete';

const CLOCKED_IN_STATUS = 'in-progress' as const;

export function isClientLiveJob(req: SecurityRequest): boolean {
  return req.status === CLOCKED_IN_STATUS && !!req.assignedGuardId;
}

/** Accepted jobs the client can live-track once the guard is en route (or on the job). */
export function isClientTrackableJob(req: SecurityRequest): boolean {
  if (!req.assignedGuardId) return false;
  if (req.status === CLOCKED_IN_STATUS) return true;
  if (req.status !== 'accepted') return false;
  return !!req.enRouteAt || !!req.arrivedAt;
}

export function getClientTrackableJobs(requests: SecurityRequest[]): SecurityRequest[] {
  return requests
    .filter(isClientTrackableJob)
    .sort((a, b) => {
      if (a.status === b.status) {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      }
      return a.status === 'in-progress' ? -1 : 1;
    });
}

export function getClientLiveJobs(requests: SecurityRequest[]): SecurityRequest[] {
  return requests
    .filter(isClientLiveJob)
    .sort((a, b) => {
      if (a.status === b.status) {
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
      }
      return a.status === 'in-progress' ? -1 : 1;
    });
}

export function getPrimaryClientLiveJob(requests: SecurityRequest[]): SecurityRequest | null {
  const live = getClientLiveJobs(requests);
  return live[0] ?? null;
}

export function inferClientShiftPhase(req: SecurityRequest): ClientShiftPhase {
  if (req.status === 'completed' || req.status === 'closed') return 'complete';
  if (req.status === 'in-progress') return 'on-duty';
  if (req.status === 'accepted') {
    if (req.arrivedAt) return 'on-site';
    if (req.enRouteAt) return 'en-route';
    return 'scheduled';
  }
  return 'scheduled';
}

export const CLIENT_SHIFT_PHASE_LABELS: Record<ClientShiftPhase, string> = {
  scheduled: 'Scheduled',
  'en-route': 'En route',
  'on-site': 'On site',
  'on-duty': 'On job',
  complete: 'Complete',
};

export const CLIENT_SHIFT_STEPS: ClientShiftPhase[] = ['scheduled', 'en-route', 'on-site', 'on-duty'];

export function clientShiftStepIndex(phase: ClientShiftPhase): number {
  const idx = CLIENT_SHIFT_STEPS.indexOf(phase);
  return idx < 0 ? 0 : idx;
}

export function guardForRequest(guards: SecurityGuard[], request: SecurityRequest): SecurityGuard | null {
  if (!request.assignedGuardId) return null;
  return guards.find((g) => g.id === request.assignedGuardId) ?? null;
}

export function clientShiftTimerLabel(req: SecurityRequest): string | null {
  if (req.status !== 'in-progress') return null;
  const startedAt = req.checkInAudit?.checkedAt ?? req.startDate;
  return computeHoursWorkedLabel(startedAt);
}

export function clientShiftScheduleLabel(req: SecurityRequest): string {
  return formatShiftRange(req.startDate, req.endDate);
}
