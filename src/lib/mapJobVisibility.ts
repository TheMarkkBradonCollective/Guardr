import type { SecurityGuard, SecurityRequest } from '../types';
import type { GuardJobView } from './guardJobView';
import { guardIsAvailableForJob } from './guardAvailability';
import { guardCanApplyToJob } from './guardJobs';
import { guardHasApplied } from './jobApplications';
import { isMultiGuardJob } from './guardTeams';
import { hasScheduleDateChange } from './jobScheduleChange';
import { isJobPaid } from './jobEditRules';
import { isJobMissed } from './jobTallies';

export function clientOwnsRequest(
  req: SecurityRequest,
  clientId: string,
  clientName?: string,
  altClientName?: string
): boolean {
  return (
    req.clientId === clientId ||
    (!!clientName && req.clientName === clientName) ||
    (!!altClientName && req.clientName === altClientName)
  );
}

export type MapViewerRole = 'guard' | 'client' | 'staff';

type GuardMapJobLike = Pick<
  SecurityRequest,
  | 'assignedGuardId'
  | 'guardSlots'
  | 'status'
  | 'startDate'
  | 'endDate'
  | 'requestType'
  | 'targetGuardId'
  | 'noShow'
  | 'replacementRequest'
  | 'checkInAudit'
>;

/** Terminal / history jobs belong on Jobs pages — never on the map. */
export function isMapHistoryStatus(status: SecurityRequest['status']): boolean {
  return status === 'completed' || status === 'closed' || status === 'cancelled';
}

function guardOwnsJob(guardId: string, req: GuardMapJobLike): boolean {
  return (
    req.assignedGuardId === guardId ||
    (req.guardSlots ?? []).some((s) => s.guardId === guardId)
  );
}

export type GuardMapPinKind = 'available' | 'direct' | 'scheduled';

/**
 * Guard map pins — available offers, direct client requests, and claimed upcoming/live jobs.
 * Past / canceled / missed never appear on the map.
 */
export function guardMapPinKind(guardId: string, req: GuardMapJobLike): GuardMapPinKind | null {
  if (isMapHistoryStatus(req.status)) return null;

  if (req.status === 'open') {
    if (req.requestType === 'direct' && req.targetGuardId === guardId) return 'direct';
    return guardIsAvailableForJob(guardId, req) ? 'available' : null;
  }

  if (guardOwnsJob(guardId, req) && (req.status === 'accepted' || req.status === 'in-progress')) {
    if (isJobMissed(req as SecurityRequest, { guardId })) return null;
    return 'scheduled';
  }

  return null;
}

/** Driving directions — only for jobs the guard is booked on. */
export function guardMapShouldRouteToJob(guardId: string, req: SecurityRequest): boolean {
  return guardMapPinKind(guardId, req) === 'scheduled';
}

/** Map accept slide — open marketplace/direct offers the guard has not claimed yet. */
export function guardMapIsUnclaimedOpenOffer(
  guard: SecurityGuard,
  job: GuardJobView,
  scheduleJobs?: SecurityRequest[]
): boolean {
  if (job.status !== 'open') return false;
  if (!guardCanApplyToJob(guard, job, scheduleJobs)) return false;
  if (isMultiGuardJob(job)) return false;
  if (job.requestType === 'direct') {
    return job.targetGuardId === guard.id && !guardHasApplied(job, guard.id);
  }
  return !guardHasApplied(job, guard.id);
}

/** Client browse pins — route only to upcoming / live owned jobs. */
export function clientMapShouldRouteToJob(req: SecurityRequest): boolean {
  const kind = clientMapPinKind(req);
  return kind === 'upcoming' || kind === 'live';
}

export function guardVisibleMapJobs(
  guardId: string,
  requests: SecurityRequest[],
  guardViews: GuardJobView[]
): GuardJobView[] {
  const viewById = new Map(guardViews.map((j) => [j.id, j]));
  return requests
    .filter((r) => guardMapPinKind(guardId, r) !== null)
    .map((r) => viewById.get(r.id) ?? ({ ...r, guardPay: 0 } as GuardJobView))
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

export type StaffMapPinKind = 'open' | 'live' | 'scheduled';

export function staffMapPinKind(req: SecurityRequest): StaffMapPinKind | null {
  if (isMapHistoryStatus(req.status)) return null;
  if (req.status === 'in-progress') return 'live';
  if (req.status === 'accepted') {
    if (isJobMissed(req)) return null;
    return 'scheduled';
  }
  if (req.status === 'open' || req.status === 'pending-review') return 'open';
  return null;
}

/** Staff map — all active / upcoming site jobs (no past, canceled, or missed). */
export function staffVisibleMapJobs(requests: SecurityRequest[]): SecurityRequest[] {
  return requests
    .filter((r) => staffMapPinKind(r) !== null)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

/** @deprecated Use staffVisibleMapJobs — kept for callers that still import staffMapJobs. */
export function staffMapJobs(requests: SecurityRequest[]): SecurityRequest[] {
  return staffVisibleMapJobs(requests);
}

export type StaffMapStatusFilter = 'all' | 'live' | 'open' | 'scheduled';

export const STAFF_MAP_STATUS_FILTERS: { id: StaffMapStatusFilter; label: string }[] = [
  { id: 'all', label: 'All jobs' },
  { id: 'live', label: 'Live' },
  { id: 'open', label: 'Open' },
  { id: 'scheduled', label: 'Scheduled' },
];

export function staffJobMatchesMapStatusFilter(
  req: SecurityRequest,
  filter: StaffMapStatusFilter
): boolean {
  const kind = staffMapPinKind(req);
  if (kind === null) return false;
  if (filter === 'all') return true;
  if (filter === 'live') return kind === 'live';
  if (filter === 'open') return kind === 'open';
  if (filter === 'scheduled') return kind === 'scheduled';
  return true;
}

/** Staff routes to any active job with coordinates when selected. */
export function staffMapShouldRouteToJob(req: SecurityRequest): boolean {
  return staffMapPinKind(req) !== null;
}

export function clientVisibleMapJobs(
  clientId: string,
  clientName: string | undefined,
  requests: SecurityRequest[],
  altClientName?: string
): SecurityRequest[] {
  return requests.filter((r) => {
    if (!clientOwnsRequest(r, clientId, clientName, altClientName)) return false;
    return clientMapPinKind(r) !== null;
  });
}

export type ClientMapPinKind = 'open' | 'pending' | 'upcoming' | 'live';

export type GuardMapStatusFilter = 'all' | 'available' | 'upcoming' | 'direct';
export type ClientMapStatusFilter = 'all' | 'open' | 'scheduled';

export const GUARD_MAP_STATUS_FILTERS: { id: GuardMapStatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'available', label: 'Available' },
  { id: 'direct', label: 'Requests' },
  { id: 'upcoming', label: 'My jobs' },
];

export const CLIENT_MAP_STATUS_FILTERS: { id: ClientMapStatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'scheduled', label: 'Upcoming' },
];

export function guardJobMatchesMapStatusFilter(
  guardId: string,
  req: SecurityRequest,
  filter: GuardMapStatusFilter
): boolean {
  const kind = guardMapPinKind(guardId, req);
  if (kind === null) return false;
  if (filter === 'all') return true;
  if (filter === 'available') return kind === 'available';
  if (filter === 'direct') return kind === 'direct';
  if (filter === 'upcoming') return kind === 'scheduled';
  return true;
}

export function clientJobMatchesMapStatusFilter(
  req: SecurityRequest,
  filter: ClientMapStatusFilter
): boolean {
  const kind = clientMapPinKind(req);
  if (kind === null) return false;
  if (filter === 'all') return true;
  if (filter === 'open') return kind === 'open' || kind === 'pending';
  if (filter === 'scheduled') return kind === 'upcoming' || kind === 'live';
  return true;
}

/**
 * Client map pins — own open / pending / upcoming / live jobs only.
 * Past, canceled, and missed stay on the Jobs page.
 */
export function clientMapPinKind(req: SecurityRequest): ClientMapPinKind | null {
  if (isMapHistoryStatus(req.status)) return null;
  if (req.status === 'in-progress') return 'live';
  if (req.status === 'accepted') {
    if (isJobMissed(req)) return null;
    return 'upcoming';
  }
  if (req.status === 'open') return 'open';
  if (req.status === 'pending-review') return 'pending';
  return null;
}

/** Client map — active / upcoming owned jobs only. */
export function clientBrowseMapJobs(
  clientId: string,
  clientName: string | undefined,
  requests: SecurityRequest[],
  altClientName?: string
): SecurityRequest[] {
  return requests
    .filter((r) => clientOwnsRequest(r, clientId, clientName, altClientName) && clientMapPinKind(r) !== null)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
}

export function unpaidStaffScheduleChangeNeedsClientApproval(
  existing: SecurityRequest,
  updates: Partial<SecurityRequest>
): boolean {
  if (isJobPaid(existing)) return false;
  const startDate = updates.startDate ?? existing.startDate;
  const endDate = updates.endDate ?? existing.endDate;
  return hasScheduleDateChange(existing, startDate, endDate);
}
