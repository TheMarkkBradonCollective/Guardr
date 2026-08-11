import type { SecurityRequest } from '../types';
import { formatTrackedHours } from './staffTimeTracking';

export interface GuardTimesheetEntry {
  requestId: string;
  title: string;
  clientName: string;
  status: SecurityRequest['status'];
  scheduledStart: string;
  scheduledEnd: string;
  scheduledHours: number;
  recordedClockIn?: string;
  recordedClockOut?: string;
  effectiveClockIn: string;
  effectiveClockOut?: string;
  workedHours: number;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function getRecordedClockIn(req: SecurityRequest): string | undefined {
  return req.checkInAudit?.checkedAt;
}

export function getRecordedClockOut(req: SecurityRequest): string | undefined {
  return req.checkOutAudit?.checkedAt;
}

/** Guard clock-in from check-in audit, or scheduled start if not yet clocked in. */
export function getEffectiveClockIn(req: SecurityRequest): string {
  return getRecordedClockIn(req) ?? req.startDate;
}

/** Guard clock-out from check-out audit only (contractor-reported times). */
export function getEffectiveClockOut(req: SecurityRequest): string | undefined {
  return getRecordedClockOut(req);
}

export function computeWorkedHours(clockInAt: string, clockOutAt?: string, now: Date = new Date()): number {
  const start = new Date(clockInAt).getTime();
  const end = clockOutAt ? new Date(clockOutAt).getTime() : now.getTime();
  if (end <= start) return 0;
  return round2((end - start) / (1000 * 60 * 60));
}

export function guardHasTimesheetActivity(req: SecurityRequest, guardId: string): boolean {
  if (req.assignedGuardId !== guardId) return false;
  return (
    req.status === 'in-progress' ||
    req.status === 'completed' ||
    Boolean(req.checkInAudit?.checkedAt)
  );
}

export function listGuardTimesheetEntries(
  requests: SecurityRequest[],
  guardId: string,
): GuardTimesheetEntry[] {
  return requests
    .filter((req) => guardHasTimesheetActivity(req, guardId))
    .map((req) => {
      const recordedClockIn = getRecordedClockIn(req);
      const recordedClockOut = getRecordedClockOut(req);
      const effectiveClockIn = getEffectiveClockIn(req);
      const effectiveClockOut = getEffectiveClockOut(req);
      return {
        requestId: req.id,
        title: req.title,
        clientName: req.clientName,
        status: req.status,
        scheduledStart: req.startDate,
        scheduledEnd: req.endDate,
        scheduledHours: req.durationHours,
        recordedClockIn,
        recordedClockOut,
        effectiveClockIn,
        effectiveClockOut,
        workedHours: computeWorkedHours(effectiveClockIn, effectiveClockOut),
      };
    })
    .sort(
      (a, b) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime(),
    );
}

export function formatGuardWorkedHours(hours: number): string {
  return formatTrackedHours(hours);
}
