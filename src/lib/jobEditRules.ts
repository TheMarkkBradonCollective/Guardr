import { JobStatus, SecurityRequest } from '../types';
import { computeDurationHours } from './dates';

const EDITABLE_STATUSES: JobStatus[] = ['pending-review', 'open'];

export function isJobPaid(req: Pick<SecurityRequest, 'paymentStatus'>): boolean {
  return !!req.paymentStatus && req.paymentStatus !== 'unpaid';
}

/** Client may change job details only before payment clears */
export function canClientEditRequest(req: SecurityRequest): boolean {
  return EDITABLE_STATUSES.includes(req.status) && !isJobPaid(req);
}

export function canClientCancelRequest(req: SecurityRequest): boolean {
  return canClientEditRequest(req);
}

export function jobEditBlockedReason(req: SecurityRequest): string | null {
  if (isJobPaid(req)) return 'This job was paid — details are locked. Contact staff if something must change.';
  if (!EDITABLE_STATUSES.includes(req.status)) {
    return 'Only open unpaid jobs can be edited.';
  }
  return null;
}

export function validateShiftSchedule(
  startDate: string,
  endDate: string,
  now = new Date()
): string | null {
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return 'Enter a valid start and end time.';
  }
  if (startMs < now.getTime()) {
    return 'Job cannot start in the past.';
  }
  if (endMs <= startMs) {
    return 'End time must be after start time.';
  }
  if (computeDurationHours(startDate, endDate) <= 0) {
    return 'Job duration must be greater than zero.';
  }
  return null;
}

/** Minimum value for datetime-local inputs — current local time */
export function minScheduleDatetimeLocal(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}
