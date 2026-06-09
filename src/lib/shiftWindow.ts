import { SecurityRequest } from '../types';

/** Guards may clock in this many minutes before scheduled start */
export const SHIFT_EARLY_START_MINUTES = 15;

/** Guards may clock out until this many minutes after scheduled end */
export const SHIFT_LATE_CLOCKOUT_MINUTES = 15;

export function shiftClockInOpensAt(startDate: string): Date {
  return new Date(new Date(startDate).getTime() - SHIFT_EARLY_START_MINUTES * 60_000);
}

export function shiftClockOutOpensAt(endDate: string): Date {
  return new Date(endDate);
}

export function shiftClockOutClosesAt(endDate: string): Date {
  return new Date(new Date(endDate).getTime() + SHIFT_LATE_CLOCKOUT_MINUTES * 60_000);
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
  const t = now.getTime();
  return t >= shiftClockOutOpensAt(job.endDate).getTime() && t <= shiftClockOutClosesAt(job.endDate).getTime();
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
  return `Clock-in opens ${formatWhen(shiftClockInOpensAt(job.startDate))} (15 min before shift start).`;
}

export function guardClockOutBlockedMessage(
  job: Pick<SecurityRequest, 'endDate'>,
  now = new Date()
): string | null {
  const t = now.getTime();
  const end = shiftClockOutOpensAt(job.endDate).getTime();
  if (t < end) {
    return `Clock-out opens at scheduled end time (${formatWhen(shiftClockOutOpensAt(job.endDate))}).`;
  }
  if (t > shiftClockOutClosesAt(job.endDate).getTime()) {
    return `Clock-out window closed (15 min after shift end). Contact staff.`;
  }
  return null;
}
