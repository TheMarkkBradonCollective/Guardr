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
  adjusted: boolean;
  adjustmentNote?: string;
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

export function getEffectiveClockIn(req: SecurityRequest): string {
  return req.shiftTimeAdjustment?.clockInAt ?? getRecordedClockIn(req) ?? req.startDate;
}

export function getEffectiveClockOut(req: SecurityRequest): string | undefined {
  return req.shiftTimeAdjustment?.clockOutAt ?? getRecordedClockOut(req);
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
    Boolean(req.checkInAudit?.checkedAt) ||
    Boolean(req.shiftTimeAdjustment?.clockInAt)
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
      const adjusted = Boolean(
        req.shiftTimeAdjustment?.clockInAt || req.shiftTimeAdjustment?.clockOutAt,
      );
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
        adjusted,
        adjustmentNote: req.shiftTimeAdjustment?.note,
      };
    })
    .sort(
      (a, b) => new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime(),
    );
}

export function validateGuardShiftTimeRange(
  clockInAt: string,
  clockOutAt: string,
): string | null {
  const start = new Date(clockInAt).getTime();
  const end = new Date(clockOutAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end)) return 'Enter valid clock-in and clock-out times.';
  if (end <= start) return 'Clock-out must be after clock-in.';
  return null;
}

export function applyGuardShiftTimeAdjustment(
  req: SecurityRequest,
  payload: { clockInAt: string; clockOutAt: string; note?: string },
  actor: { id: string; email?: string },
): SecurityRequest {
  const validationError = validateGuardShiftTimeRange(payload.clockInAt, payload.clockOutAt);
  if (validationError) throw new Error(validationError);

  return {
    ...req,
    shiftTimeAdjustment: {
      clockInAt: payload.clockInAt,
      clockOutAt: payload.clockOutAt,
      adjustedAt: new Date().toISOString(),
      adjustedById: actor.id,
      adjustedByEmail: actor.email,
      note: payload.note?.trim() || undefined,
    },
  };
}

export function formatGuardWorkedHours(hours: number): string {
  return formatTrackedHours(hours);
}
