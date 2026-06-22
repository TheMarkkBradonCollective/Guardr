import { SecurityGuard, SecurityRequest, SessionUser } from '../types';
import { isGuardAccountActive } from './accountStatus';
import { guardCanWorkFieldJobs } from './guardQualification';

/** Match a session user to their guard row (staff often share one email across roles). */
export function findGuardProfileForUser(
  user: Pick<SessionUser, 'id' | 'email'>,
  guards: SecurityGuard[]
): SecurityGuard | undefined {
  const emailLower = user.email.toLowerCase();
  return guards.find((g) => g.id === user.id || g.email.toLowerCase() === emailLower);
}

export interface GuardWorkHistoryItem {
  requestId: string;
  title: string;
  location: string;
  startDate: string;
  endDate: string;
  status: SecurityRequest['status'];
  ratingGiven?: number;
  reviewText?: string;
}

/** Guards with a valid guard card on file — clients may browse, hire, and send direct requests */
export function getBrowsableGuards(guards: SecurityGuard[]): SecurityGuard[] {
  return guards
    .filter((g) => guardCanWorkFieldJobs(g))
    .sort((a, b) => b.rating - a.rating || b.jobsCompleted - a.jobsCompleted);
}

/** Jobs that count as this client having worked with the guard before (rehire eligible). */
const CLIENT_REHIRE_STATUSES: SecurityRequest['status'][] = [
  'accepted',
  'in-progress',
  'completed',
  'closed',
];

export function guardHasWorkedWithClient(
  guardId: string,
  clientId: string,
  requests: SecurityRequest[]
): boolean {
  return requests.some(
    (r) =>
      r.clientId === clientId &&
      r.assignedGuardId === guardId &&
      CLIENT_REHIRE_STATUSES.includes(r.status)
  );
}

/** Guards a client may rehire — bypasses Guardr applicant review when selected at job create. */
export function getClientRehireableGuards(
  clientId: string,
  requests: SecurityRequest[],
  guards: SecurityGuard[]
): SecurityGuard[] {
  const guardIds = new Set(
    requests
      .filter(
        (r) =>
          r.clientId === clientId &&
          r.assignedGuardId &&
          CLIENT_REHIRE_STATUSES.includes(r.status)
      )
      .map((r) => r.assignedGuardId as string)
  );
  return guards
    .filter((g) => guardIds.has(g.id) && isGuardAccountActive(g))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getGuardHistoryWithClient(
  guardId: string,
  clientId: string,
  requests: SecurityRequest[]
): GuardWorkHistoryItem[] {
  return requests
    .filter(
      (r) =>
        r.assignedGuardId === guardId &&
        (r.clientId === clientId || r.status === 'completed' || r.status === 'in-progress' || r.status === 'accepted')
    )
    .filter((r) => r.clientId === clientId)
    .map((r) => ({
      requestId: r.id,
      title: r.title,
      location: r.location,
      startDate: r.startDate,
      endDate: r.endDate,
      status: r.status,
      ratingGiven: r.ratingGiven,
      reviewText: r.reviewText,
    }))
    .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
}

export function filterGuardsByQuery(guards: SecurityGuard[], query: string): SecurityGuard[] {
  const q = query.trim().toLowerCase();
  if (!q) return guards;
  return guards.filter(
    (g) =>
      g.name.toLowerCase().includes(q) ||
      g.bio.toLowerCase().includes(q) ||
      (g.summary?.toLowerCase().includes(q) ?? false) ||
      (g.headline?.toLowerCase().includes(q) ?? false) ||
      (g.about?.toLowerCase().includes(q) ?? false) ||
      g.experience.some(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.company.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q)
      )
  );
}
