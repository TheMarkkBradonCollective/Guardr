import type { SecurityRequest } from '../types';
import type { GuardJobView } from './guardJobView';
import { hasScheduleDateChange } from './jobScheduleChange';
import { isJobPaid } from './jobEditRules';

export type MapViewerRole = 'guard' | 'client' | 'staff';

export function staffMapJobs(requests: SecurityRequest[]): SecurityRequest[] {
  return requests.filter((r) => r.status !== 'closed' || r.status === 'closed');
}

/** Staff sees all current, past, and cancelled jobs. */
export function staffVisibleMapJobs(requests: SecurityRequest[]): SecurityRequest[] {
  return [...requests];
}

/** Guards see available, their booked/scheduled, and their past work — not others' completed or cancelled jobs. */
export function guardVisibleMapJobs(
  guardId: string,
  requests: SecurityRequest[],
  guardViews: GuardJobView[]
): GuardJobView[] {
  const viewById = new Map(guardViews.map((j) => [j.id, j]));
  return requests
    .filter((r) => {
      const isMine =
        r.assignedGuardId === guardId ||
        (r.guardSlots ?? []).some((s) => s.guardId === guardId);
      if (r.status === 'cancelled' && !isMine) return false;
      if (r.status === 'completed' && r.assignedGuardId !== guardId) return false;
      if (r.status === 'closed' && !isMine) return false;
      if (r.status === 'open') return true;
      return isMine;
    })
    .map((r) => viewById.get(r.id) ?? ({ ...r, guardPay: 0 } as GuardJobView));
}

/** Clients see their upcoming, past, and cancelled jobs only. */
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
