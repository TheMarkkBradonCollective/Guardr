import { JobStatus, PlatformRole, SecurityRequest } from '../types';
import type { ClientPaymentGates } from './platformSettings';
import { computeDurationHours } from './dates';

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

/** Client Stripe checkout is only available after staff approves the job offer */
export function canClientPayWithStripe(
  req: Pick<SecurityRequest, 'status' | 'paymentStatus'>,
  gates: ClientPaymentGates
): boolean {
  return gates.allowStripe && req.status === 'open' && !isJobPaid(req);
}

/** Client Square checkout is only available after staff approves the job offer */
export function canClientPayWithSquare(
  req: Pick<SecurityRequest, 'status' | 'paymentStatus'>,
  gates: ClientPaymentGates
): boolean {
  return gates.allowSquare && req.status === 'open' && !isJobPaid(req);
}

/** @deprecated Cash payments removed from the platform. */
export function canClientRequestCashPayment(
  _req: Pick<SecurityRequest, 'status' | 'paymentStatus' | 'clientCashPaymentRequested'>,
  _gates: ClientPaymentGates
): boolean {
  return false;
}

/** @deprecated Use canClientPayWithStripe */
export function canClientPayForJob(
  req: Pick<SecurityRequest, 'status' | 'paymentStatus' | 'clientCashPaymentRequested'>,
  gates: ClientPaymentGates
): boolean {
  return canClientPayWithStripe(req, gates);
}

export function canEditJobTitleAndLocation(req: SecurityRequest): boolean {
  return LISTING_EDIT_STATUSES.includes(req.status);
}

/** Staff listing edits — executive roles may update through completed; administrators follow client window */
export function canStaffEditJobTitleAndLocation(req: SecurityRequest, role: PlatformRole): boolean {
  if (role === 'manager' || role === 'director' || role === 'owner') return req.status !== 'closed';
  if (role === 'administrator') return canEditJobTitleAndLocation(req);
  return false;
}

/** Moderator+ may add map coordinates on jobs awaiting staff review or already open. */
export function canStaffEditJobMapCoordinates(req: SecurityRequest, role: PlatformRole): boolean {
  if (role === 'client' || role === 'guard') return false;
  if (req.status === 'closed' || req.status === 'completed') return false;
  return req.status === 'pending-review' || req.status === 'open';
}

export function canEditJobSchedule(req: SecurityRequest): boolean {
  return !isJobPaid(req) && LISTING_EDIT_STATUSES.includes(req.status);
}

/** Unpaid jobs — client or staff may change times freely on any active job (no approval workflow). */
export function canEditUnpaidJobSchedule(req: SecurityRequest): boolean {
  return canEditJobSchedule(req);
}

/** Staff may edit unpaid schedules wherever they can edit the listing (directors: any non-closed job). */
export function canStaffEditUnpaidJobSchedule(req: SecurityRequest, role: PlatformRole): boolean {
  if (isJobPaid(req)) return false;
  if (role === 'manager' || role === 'director' || role === 'owner') return req.status !== 'closed';
  return LISTING_EDIT_STATUSES.includes(req.status);
}

/** Schedule is locked once the client has paid — title/location stay editable. */
export function isJobScheduleLocked(req: SecurityRequest): boolean {
  return isJobPaid(req);
}

/** Paid jobs may reschedule times (same paid hours, or staff-approved extension). */
export function canClientReschedulePaidSchedule(req: SecurityRequest): boolean {
  return (
    isJobPaid(req) &&
    ['open', 'accepted', 'in-progress'].includes(req.status) &&
    (!req.scheduleChangeStatus || req.scheduleChangeStatus === 'none')
  );
}

export function canStaffReschedulePaidSchedule(req: SecurityRequest): boolean {
  return canClientReschedulePaidSchedule(req);
}

/** Whether the edit form should show schedule fields (unpaid full edit or paid reschedule). */
export function canClientEditScheduleFields(req: SecurityRequest): boolean {
  return canEditJobSchedule(req) || canClientReschedulePaidSchedule(req);
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
  if (req.scheduleChangeStatus === 'pending_staff') {
    return 'A schedule change is awaiting staff approval.';
  }
  if (req.scheduleChangeStatus === 'pending_client') {
    return 'A schedule change is awaiting your approval.';
  }
  if (req.scheduleChangeStatus === 'awaiting_payment') {
    return 'Pay the schedule extension before times update.';
  }
  if (req.scheduleChangeStatus === 'pending_staff_billing') {
    return 'Schedule change is awaiting staff billing confirmation.';
  }
  if (canClientReschedulePaidSchedule(req)) {
    return null;
  }
  if (canEditUnpaidJobSchedule(req)) {
    return null;
  }
  if (isJobScheduleLocked(req)) {
    return 'Schedule is locked after payment. Update title and location only, or contact staff.';
  }
  return 'Schedule cannot be changed in this job status.';
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
