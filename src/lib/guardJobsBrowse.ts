import type { SecurityGuard, SecurityRequest } from '../types';
import type { GuardJobView } from './guardJobView';
import { guardJobInServiceArea } from './guardOpenJobNotify';
import { isJobMissed } from './jobTallies';
import {
  guardJobMatchesMapStatusFilter,
  guardMapPinKind,
  guardVisibleMapJobs,
  isMapHistoryStatus,
  type GuardMapStatusFilter,
} from './mapJobVisibility';

/** Shared guard job buckets — list (Jobs tab) and map pins use the same data. */
export type GuardJobsBrowseTab = 'available' | 'scheduled' | 'completed' | 'missed';

export interface GuardBrowseJobLists {
  /** Active / upcoming jobs for the map (no past / canceled / missed). */
  all: GuardJobView[];
  available: GuardJobView[];
  scheduled: GuardJobView[];
  completed: GuardJobView[];
  missed: GuardJobView[];
  /** Completed + missed history (Jobs page only). */
  past: GuardJobView[];
}

function guardOwnsJob(guardId: string, job: GuardJobView): boolean {
  return (
    job.assignedGuardId === guardId ||
    (job.guardSlots ?? []).some((slot) => slot.guardId === guardId)
  );
}

/**
 * Jobs for map + Jobs tabs.
 * - `all` / available / scheduled → map (active & upcoming only)
 * - completed / missed / past → Jobs page history only
 */
export function getGuardBrowseJobLists(
  guard: Pick<SecurityGuard, 'id' | 'serviceAreas'>,
  jobs: GuardJobView[]
): GuardBrowseJobLists {
  const guardId = guard.id;
  const requests = jobs as unknown as SecurityRequest[];

  const all = guardVisibleMapJobs(guardId, requests, jobs).filter(
    (job) => job.status !== 'in-progress'
  );

  const available = all.filter((job) => {
    const kind = guardMapPinKind(guardId, job as unknown as SecurityRequest);
    if (kind !== 'available' && kind !== 'direct') return false;
    if (kind === 'direct') return true;
    return guardJobInServiceArea(guard, job as unknown as SecurityRequest);
  });

  const scheduled = all.filter(
    (job) => guardMapPinKind(guardId, job as unknown as SecurityRequest) === 'scheduled'
  );

  const historyMine = jobs.filter((job) => {
    if (!guardOwnsJob(guardId, job)) return false;
    const asReq = job as unknown as SecurityRequest;
    if (isJobMissed(asReq, { guardId })) return true;
    return isMapHistoryStatus(job.status);
  });

  const missed = historyMine.filter((job) =>
    isJobMissed(job as unknown as SecurityRequest, { guardId })
  );
  const completed = historyMine.filter(
    (job) => !isJobMissed(job as unknown as SecurityRequest, { guardId })
  );

  return {
    all,
    available,
    scheduled,
    completed,
    missed,
    past: [...completed, ...missed],
  };
}

export function filterGuardBrowseJobs(
  guardId: string,
  jobs: GuardJobView[],
  filter: GuardMapStatusFilter
): GuardJobView[] {
  return jobs.filter((job) =>
    guardJobMatchesMapStatusFilter(guardId, job as SecurityRequest, filter)
  );
}

export function guardBrowseTabFromMapFilter(filter: GuardMapStatusFilter): GuardJobsBrowseTab {
  if (filter === 'upcoming') return 'scheduled';
  if (filter === 'direct') return 'available';
  return 'available';
}

export function mapFilterFromBrowseTab(tab: GuardJobsBrowseTab): GuardMapStatusFilter {
  if (tab === 'completed' || tab === 'missed') return 'all';
  if (tab === 'scheduled') return 'upcoming';
  return 'available';
}
