import type { SecurityRequest } from '../types';
import type { GuardJobView } from './guardJobView';
import { hasScheduleDateChange } from './jobScheduleChange';
import { isJobPaid } from './jobEditRules';

export type MapViewerRole = 'guard' | 'client' | 'staff';

export function staffMapJobs(requests: SecurityRequest[]): SecurityRequest[] {
  return requests.filter((r) => r.status !== 'closed' || r.status === 'closed');
}

/** Guards see available, their booked/scheduled, and their past work — not others' completed or cancelled jobs. */
export function guardMapPinKind(guardId: string, req: SecurityRequest): 'available' | 'scheduled' | 'past' | null {
  const isMine =
    req.assignedGuardId === guardId ||
    (req.guardSlots ?? []).some((s) => s.guardId === guardId);
  if (req.status === 'cancelled') return null;
  if (req.status === 'open') return 'available';
  if (isMine && (req.status === 'accepted' || req.status === 'in-progress')) return 'scheduled';
  if (isMine && (req.status === 'completed' || req.status === 'closed')) return 'past';
  return null;
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
  if (req.status === 'cancelled') return 'cancelled';
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
  requests: SecurityRequest[]
): SecurityRequest[] {
  return requests.filter((r) => {
    const isMine = r.clientId === clientId || r.clientName === clientName;
    if (!isMine) return false;
    return ['open', 'accepted', 'in-progress', 'completed', 'cancelled', 'pending-review'].includes(
      r.status
    );
  });
}

export type ClientMapPinKind = 'upcoming' | 'past' | 'cancelled';

export type GuardMapStatusFilter = 'all' | 'available' | 'upcoming' | 'complete';
export type ClientMapStatusFilter = 'all' | 'scheduled' | 'complete';

export const GUARD_MAP_STATUS_FILTERS: { id: GuardMapStatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'available', label: 'Available' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'complete', label: 'Complete' },
];

export const CLIENT_MAP_STATUS_FILTERS: { id: ClientMapStatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
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
  if (filter === 'all') return clientMapPinKind(req) !== null;
  const kind = clientMapPinKind(req);
  if (filter === 'scheduled') return kind === 'upcoming';
  if (filter === 'complete') return kind === 'past';
  return true;
}

export function clientMapPinKind(req: SecurityRequest): ClientMapPinKind | null {
  if (req.status === 'cancelled') return 'cancelled';
  if (req.status === 'completed' || req.status === 'closed') return 'past';
  if (req.status === 'accepted') return 'upcoming';
  return null;
}

/** Map blips when no guard is clocked in — past, upcoming (accepted), and cancelled only. */
export function clientBrowseMapJobs(
  clientId: string,
  clientName: string | undefined,
  requests: SecurityRequest[]
): SecurityRequest[] {
  return requests
    .filter((r) => {
      const isMine = r.clientId === clientId || r.clientName === clientName;
      return isMine && clientMapPinKind(r) !== null;
    })
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
