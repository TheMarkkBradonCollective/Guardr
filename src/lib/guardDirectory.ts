import { GuardSpecialty, JobType, SecurityGuard, SecurityRequest, SessionUser } from '../types';
import { isGuardAccountActive } from './guardAccountActivation';
import { guardCanWorkFieldJobs } from './guardQualification';
import { JOB_TYPE_LABELS } from './guardJobs';

// ─── Filter & Sort types ──────────────────────────────────────────────────────

export type GuardSortKey = 'rating' | 'jobs' | 'experience' | 'name';

export interface GuardDirectoryFilters {
  /** Text search across name, bio, headline, experience */
  query: string;
  /** Only show favourited guards */
  favoritesOnly: boolean;
  /** Armed guards only */
  armedOnly: boolean;
  /** Minimum average rating (0 = any) */
  minRating: number;
  /** Minimum years of experience (0 = any) */
  minExperience: number;
  /** Specialties guard must have at least one of (empty = any) */
  specialties: GuardSpecialty[];
  /** Only show verified/approved guards */
  verifiedOnly: boolean;
  /** Only show trusted (Director/Owner-flagged) guards */
  trustedOnly: boolean;
  /** Only guards the client has worked with before */
  previouslyWorkedWith: boolean;
  /** Sort order for results */
  sortBy: GuardSortKey;
}

export const DEFAULT_GUARD_FILTERS: GuardDirectoryFilters = {
  query: '',
  favoritesOnly: false,
  armedOnly: false,
  minRating: 0,
  minExperience: 0,
  specialties: [],
  verifiedOnly: false,
  trustedOnly: false,
  previouslyWorkedWith: false,
  sortBy: 'rating',
};

export function countActiveFilters(filters: GuardDirectoryFilters): number {
  let count = 0;
  if (filters.favoritesOnly) count++;
  if (filters.armedOnly) count++;
  if (filters.minRating > 0) count++;
  if (filters.minExperience > 0) count++;
  if (filters.specialties.length > 0) count++;
  if (filters.verifiedOnly) count++;
  if (filters.trustedOnly) count++;
  if (filters.previouslyWorkedWith) count++;
  return count;
}

export function applyGuardFilters(
  guards: SecurityGuard[],
  filters: GuardDirectoryFilters,
  favoriteGuardIds: string[],
  previouslyWorkedIds: Set<string>
): SecurityGuard[] {
  let result = guards;

  if (filters.query.trim()) {
    result = filterGuardsByQuery(result, filters.query);
  }
  if (filters.favoritesOnly) {
    result = result.filter((g) => favoriteGuardIds.includes(g.id));
  }
  if (filters.armedOnly) {
    result = result.filter((g) => g.isArmed);
  }
  if (filters.minRating > 0) {
    result = result.filter((g) => g.rating >= filters.minRating);
  }
  if (filters.minExperience > 0) {
    result = result.filter((g) => (g.yearsExperience ?? 0) >= filters.minExperience);
  }
  if (filters.specialties.length > 0) {
    result = result.filter((g) =>
      filters.specialties.some((s) => g.specialties?.includes(s))
    );
  }
  if (filters.verifiedOnly) {
    result = result.filter((g) => g.verified);
  }
  if (filters.trustedOnly) {
    result = result.filter((g) => g.trusted === true);
  }
  if (filters.previouslyWorkedWith) {
    result = result.filter((g) => previouslyWorkedIds.has(g.id));
  }

  result = sortGuards(result, filters.sortBy);

  return result;
}

export function sortGuards(guards: SecurityGuard[], sortBy: GuardSortKey): SecurityGuard[] {
  const sorted = [...guards];
  switch (sortBy) {
    case 'rating':
      return sorted.sort((a, b) => b.rating - a.rating || b.jobsCompleted - a.jobsCompleted);
    case 'jobs':
      return sorted.sort((a, b) => b.jobsCompleted - a.jobsCompleted || b.rating - a.rating);
    case 'experience':
      return sorted.sort((a, b) => (b.yearsExperience ?? 0) - (a.yearsExperience ?? 0) || b.rating - a.rating);
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return sorted;
  }
}

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

/** Completed platform work shown to clients browsing a guard profile (other clients anonymized). */
export interface GuardPlatformHistoryItem {
  requestId: string;
  jobType: JobType;
  jobTypeLabel: string;
  locationLabel: string;
  startDate: string;
  endDate: string;
  armedRequired: boolean;
  clientRating?: number;
  clientReview?: string;
}

const PLATFORM_HISTORY_STATUSES: SecurityRequest['status'][] = ['completed', 'closed'];

function formatPlatformHistoryLocation(
  req: Pick<SecurityRequest, 'location' | 'state'>
): string {
  if (req.state?.trim()) return req.state.trim();
  const parts = req.location.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) return parts.slice(-2).join(', ');
  return parts[0] || 'On platform';
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

/** Completed assignments with other clients — anonymized for guard directory profiles. */
export function getGuardPlatformHistory(
  guardId: string,
  requests: SecurityRequest[],
  excludeClientId?: string
): GuardPlatformHistoryItem[] {
  return requests
    .filter(
      (r) =>
        r.assignedGuardId === guardId &&
        PLATFORM_HISTORY_STATUSES.includes(r.status) &&
        (!excludeClientId || r.clientId !== excludeClientId)
    )
    .map((r) => ({
      requestId: r.id,
      jobType: r.type,
      jobTypeLabel: JOB_TYPE_LABELS[r.type] || r.type,
      locationLabel: formatPlatformHistoryLocation(r),
      startDate: r.startDate,
      endDate: r.endDate,
      armedRequired: r.armedRequired,
      clientRating: r.ratingGiven,
      clientReview: r.reviewText,
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
