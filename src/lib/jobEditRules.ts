import { JobStatus, PlatformRole, SecurityRequest } from '../types';
import type { ClientPaymentGates } from './platformSettings';
import { computeDurationHours } from './dates';

const FULL_EDIT_STATUSES: JobStatus[] = ['pending-review', 'open'];

/** Title and location may be updated through in-progress (not after completed/closed). */
const LISTING_EDIT_STATUSES: JobStatus[] = ['pending-review', 'open', 'accepted', 'in-progress'];

const TITLE_LOCATION_FIELDS = [
  'title',
  'siteName',
  'address',
  'state',
  'location',
  'latitude',
  'longitude',
] as const;

export type JobTitleLocationUpdate = Pick<
  SecurityRequest,
  'title' | 'siteName' | 'address' | 'state' | 'location' | 'latitude' | 'longitude'
>;

export function isJobPaid(req: Pick<SecurityRequest, 'paymentStatus'>): boolean {
  return !!req.paymentStatus && req.paymentStatus !== 'unpaid';
}

/** Client checkout is only available after staff approves the job offer */
export function canClientPayForJob(
  req: Pick<SecurityRequest, 'status' | 'paymentStatus' | 'clientCashPaymentRequested'>,
  gates: ClientPaymentGates
): boolean {
  return (
    gates.allowStripe &&
    req.status === 'open' &&
    !isJobPaid(req) &&
    !req.clientCashPaymentRequested
  );
}

/** Client may request to pay in cash on open unpaid jobs */
export function canClientRequestCashPayment(
  req: Pick<SecurityRequest, 'status' | 'paymentStatus' | 'clientCashPaymentRequested'>,
  gates: ClientPaymentGates
): boolean {
  return (
    gates.allowCash &&
    req.status === 'open' &&
    !isJobPaid(req) &&
    !req.clientCashPaymentRequested
  );
}

export function canEditJobTitleAndLocation(req: SecurityRequest): boolean {
  return LISTING_EDIT_STATUSES.includes(req.status);
}

/** Staff listing edits — directors may update through completed; administrators follow client window */
export function canStaffEditJobTitleAndLocation(req: SecurityRequest, role: PlatformRole): boolean {
  if (role === 'director' || role === 'owner') return req.status !== 'closed';
  if (role === 'administrator') return canEditJobTitleAndLocation(req);
  return false;
}

export function canEditJobSchedule(req: SecurityRequest): boolean {
  return FULL_EDIT_STATUSES.includes(req.status) && !isJobPaid(req);
}

/** Schedule is locked once the client has paid — title/location stay editable. */
export function isJobScheduleLocked(req: SecurityRequest): boolean {
  return isJobPaid(req);
}

/** Client may change schedule and billing only before payment clears */
export function canClientEditRequest(req: SecurityRequest): boolean {
  return canEditJobSchedule(req);
}

/** Client may update title and location while the job is still active */
export function canClientEditJobListing(req: SecurityRequest): boolean {
  return canEditJobTitleAndLocation(req);
}

export function canClientCancelRequest(req: SecurityRequest): boolean {
  return canClientEditRequest(req);
}

export function jobEditBlockedReason(req: SecurityRequest): string | null {
  if (!canEditJobTitleAndLocation(req)) {
    return 'This job cannot be edited in its current status.';
  }
  return null;
}

export function scheduleEditBlockedReason(req: SecurityRequest): string | null {
  if (isJobScheduleLocked(req)) {
    return 'Schedule is locked after payment. Update title and location only, or contact staff.';
  }
  if (!FULL_EDIT_STATUSES.includes(req.status)) {
    return 'Schedule can only be changed on open unpaid jobs.';
  }
  return null;
}

/** Strip schedule/billing fields when payment has cleared. */
export function sanitizeJobListingUpdates(
  existing: SecurityRequest,
  updates: Partial<SecurityRequest>
): Partial<SecurityRequest> {
  if (!isJobPaid(existing)) {
    return updates;
  }

  const safe: Partial<SecurityRequest> = {};
  for (const key of TITLE_LOCATION_FIELDS) {
    if (updates[key] !== undefined) {
      (safe as Record<string, unknown>)[key] = updates[key];
    }
  }
  return safe;
}

export function buildLocationLabel(siteName: string | undefined, address: string): string {
  const site = siteName?.trim();
  const addr = address.trim();
  return site ? `${site} — ${addr}` : addr;
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
