import { SecurityRequest } from '../types';

/** Guards may clock in this many minutes before scheduled start */
export const SHIFT_EARLY_START_MINUTES = 15;

export function shiftClockInOpensAt(startDate: string): Date {
  return new Date(new Date(startDate).getTime() - SHIFT_EARLY_START_MINUTES * 60_000);
}

export function shiftClockOutOpensAt(endDate: string): Date {
  return new Date(endDate);
}

/** ISO timestamp when the guard clocked in and went on duty. */
export function shiftDutyStartedAt(
  job: Pick<SecurityRequest, 'checkInAudit'>
): string | null {
  return job.checkInAudit?.checkedAt ?? null;
}

/** Elapsed on-duty seconds since clock-in, based on persisted checkedAt. */
export function computeShiftDutySeconds(
  startedAt: string | null | undefined,
  now = Date.now()
): number {
  if (!startedAt) return 0;
  return Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
}

export function canGuardClockIn(
  job: Pick<SecurityRequest, 'startDate'>,
  now = new Date()
): boolean {
  return now.getTime() >= shiftClockInOpensAt(job.startDate).getTime();
}

export function canGuardClockOut(
  job: Pick<SecurityRequest, 'endDate'>,
  now = new Date()
): boolean {
  return now.getTime() >= shiftClockOutOpensAt(job.endDate).getTime();
}

/** True when the guard is ending the shift after the scheduled end time. */
export function isLateClockOut(
  job: Pick<SecurityRequest, 'endDate'>,
  now = new Date()
): boolean {
  return now.getTime() > shiftClockOutOpensAt(job.endDate).getTime();
}

function formatWhen(d: Date): string {
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function guardClockInBlockedMessage(
  job: Pick<SecurityRequest, 'startDate'>,
  now = new Date()
): string | null {
  if (canGuardClockIn(job, now)) return null;
  return `Job start opens ${formatWhen(shiftClockInOpensAt(job.startDate))} (15 min before job start).`;
}

export function guardClockOutBlockedMessage(
  job: Pick<SecurityRequest, 'endDate'>,
  now = new Date()
): string | null {
  if (canGuardClockOut(job, now)) return null;
  return `Complete job opens at scheduled end time (${formatWhen(shiftClockOutOpensAt(job.endDate))}).`;
}
