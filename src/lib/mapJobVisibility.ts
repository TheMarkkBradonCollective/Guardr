import type { SecurityGuard, SecurityRequest } from '../types';
import type { GuardJobView } from './guardJobView';
import { guardCanApplyToJob } from './guardJobs';
import { guardHasApplied } from './jobApplications';
import { isMultiGuardJob } from './guardTeams';
import { hasScheduleDateChange } from './jobScheduleChange';
import { isJobPaid } from './jobEditRules';

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

export function staffMapJobs(requests: SecurityRequest[]): SecurityRequest[] {
  return requests.filter((r) => r.status !== 'closed' || r.status === 'closed');
}

/** Guards see available, their booked/scheduled, and their past work — not others' completed or cancelled jobs. */
export function guardMapPinKind(
  guardId: string,
  req: Pick<SecurityRequest, 'assignedGuardId' | 'guardSlots' | 'status'>
): 'available' | 'scheduled' | 'past' | null {
  const isMine =
    req.assignedGuardId === guardId ||
    (req.guardSlots ?? []).some((s) => s.guardId === guardId);
  if (req.status === 'open') return 'available';
  if (isMine && (req.status === 'accepted' || req.status === 'in-progress')) return 'scheduled';
  if (isMine && (req.status === 'completed' || req.status === 'closed')) return 'past';
  return null;
}

/** Driving directions — only for jobs the guard is booked on or has completed. */
export function guardMapShouldRouteToJob(guardId: string, req: SecurityRequest): boolean {
  const kind = guardMapPinKind(guardId, req);
  return kind === 'scheduled' || kind === 'past';
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

/** Client browse pins — route only to scheduled or completed jobs (not cancelled). */
export function clientMapShouldRouteToJob(req: SecurityRequest): boolean {
  const kind = clientMapPinKind(req);
  return kind === 'upcoming' || kind === 'past';
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
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export type StaffMapPinKind = 'open' | 'live' | 'scheduled' | 'past' | 'cancelled' | 'other';

export function staffMapPinKind(req: SecurityRequest): StaffMapPinKind {
  if (req.status === 'completed' || req.status === 'closed') return 'past';
  if (req.status === 'in-progress') return 'live';
  if (req.status === 'accepted') return 'scheduled';
  if (req.status === 'open') return 'open';
  return 'other';
}

/** Staff sees all current, past, and cancelled jobs. */
export function staffVisibleMapJobs(requests: SecurityRequest[]): SecurityRequest[] {
  return [...requests].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
}
export function clientVisibleMapJobs(
  clientId: string,
  clientName: string | undefined,
  requests: SecurityRequest[],
  altClientName?: string
): SecurityRequest[] {
  return requests.filter((r) => {
    if (!clientOwnsRequest(r, clientId, clientName, altClientName)) return false;
    return ['open', 'accepted', 'in-progress', 'completed', 'cancelled', 'pending-review'].includes(
      r.status
    );
  });
}

export type ClientMapPinKind = 'open' | 'pending' | 'upcoming' | 'live' | 'past' | 'cancelled';

export type GuardMapStatusFilter = 'all' | 'available' | 'upcoming' | 'complete';
export type ClientMapStatusFilter = 'all' | 'open' | 'scheduled' | 'complete';

export const GUARD_MAP_STATUS_FILTERS: { id: GuardMapStatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'available', label: 'Available' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'complete', label: 'Past' },
];

export const CLIENT_MAP_STATUS_FILTERS: { id: ClientMapStatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'open', label: 'Open' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'complete', label: 'Complete' },
];

export function guardJobMatchesMapStatusFilter(
  guardId: string,
  req: SecurityRequest,
  filter: GuardMapStatusFilter
): boolean {
  if (filter === 'all') return guardMapPinKind(guardId, req) !== null;
  const kind = guardMapPinKind(guardId, req);
  if (filter === 'available') return kind === 'available';
  if (filter === 'upcoming') return kind === 'scheduled';
  if (filter === 'complete') return kind === 'past';
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
  if (filter === 'complete') return kind === 'past' || kind === 'cancelled';
  return true;
}

export function clientMapPinKind(req: SecurityRequest): ClientMapPinKind | null {
  if (req.status === 'completed' || req.status === 'closed') return 'past';
  if (req.status === 'in-progress') return 'live';
  if (req.status === 'accepted') return 'upcoming';
  if (req.status === 'open') return 'open';
  if (req.status === 'pending-review') return 'pending';
  return null;
}

/** Client map pins — open listings, pending review, scheduled, live, and history. */
export function clientBrowseMapJobs(
  clientId: string,
  clientName: string | undefined,
  requests: SecurityRequest[],
  altClientName?: string
): SecurityRequest[] {
  return requests
    .filter((r) => clientOwnsRequest(r, clientId, clientName, altClientName) && clientMapPinKind(r) !== null)
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
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
