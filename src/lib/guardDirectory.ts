import { SecurityGuard, SecurityRequest, SessionUser } from '../types';

const STAFF_GUARD_MODE_KEY = 'guardr_staff_guard_mode';

/** Match a session user to their guard row (staff often share one email across roles). */
export function findGuardProfileForUser(
  user: Pick<SessionUser, 'id' | 'email'>,
  guards: SecurityGuard[]
): SecurityGuard | undefined {
  const emailLower = user.email.toLowerCase();
  return guards.find((g) => g.id === user.id || g.email.toLowerCase() === emailLower);
}

export function loadStaffGuardMode(): boolean {
  try {
    const saved = localStorage.getItem(STAFF_GUARD_MODE_KEY);
    if (saved !== null) return saved === 'true';
  } catch {
    /* ignore */
  }
  return false;
}

export function saveStaffGuardMode(enabled: boolean): void {
  try {
    localStorage.setItem(STAFF_GUARD_MODE_KEY, String(enabled));
  } catch {
    /* ignore */
  }
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

/** Verified guards available for clients to browse and hire (includes staff who work shifts) */
export function getBrowsableGuards(guards: SecurityGuard[]): SecurityGuard[] {
  return guards
    .filter((g) => g.verified && g.userStatus !== 'suspended' && g.userStatus !== 'blocked')
    .sort((a, b) => b.rating - a.rating || b.jobsCompleted - a.jobsCompleted);
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
