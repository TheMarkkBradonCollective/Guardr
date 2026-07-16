import type { SecurityGuard, SecurityRequest } from '../types';
import type { GuardJobView } from './guardJobView';
import { guardJobInServiceArea } from './guardOpenJobNotify';
import { isJobMissed } from './jobTallies';
import {
  guardJobMatchesMapStatusFilter,
  guardMapPinKind,
  guardVisibleMapJobs,
  type GuardMapStatusFilter,
} from './mapJobVisibility';

/** Shared guard job buckets — list (Jobs tab) and map pins use the same data. */
export type GuardJobsBrowseTab = 'available' | 'scheduled' | 'completed' | 'missed';

export interface GuardBrowseJobLists {
  all: GuardJobView[];
  available: GuardJobView[];
  scheduled: GuardJobView[];
  completed: GuardJobView[];
  missed: GuardJobView[];
  /** Completed + missed history (messages, map past filter). */
  past: GuardJobView[];
}

/** Jobs visible on map / Jobs tab (excludes in-progress — active shift uses overlay). */
export function getGuardBrowseJobLists(
  guard: Pick<SecurityGuard, 'id' | 'serviceAreas'>,
  jobs: GuardJobView[]
): GuardBrowseJobLists {
  const guardId = guard.id;
  const requests = jobs as unknown as SecurityRequest[];
  const all = guardVisibleMapJobs(guardId, requests, jobs).filter(
    (job) => job.status !== 'in-progress'
  );

  const available = all.filter(
    (job) =>
      guardMapPinKind(guardId, job as unknown as SecurityRequest) === 'available' &&
      guardJobInServiceArea(guard, job as unknown as SecurityRequest)
  );

  const booked = all.filter(
    (job) => guardMapPinKind(guardId, job as unknown as SecurityRequest) === 'scheduled'
  );
  const scheduled = booked.filter(
    (job) => !isJobMissed(job as unknown as SecurityRequest, { guardId })
  );
  const missedFromBooked = booked.filter((job) =>
    isJobMissed(job as unknown as SecurityRequest, { guardId })
  );

  const pastJobs = all.filter(
    (job) => guardMapPinKind(guardId, job as unknown as SecurityRequest) === 'past'
  );
  const completed = pastJobs.filter(
    (job) => !isJobMissed(job as unknown as SecurityRequest, { guardId })
  );
  const missedFromPast = pastJobs.filter((job) =>
    isJobMissed(job as unknown as SecurityRequest, { guardId })
  );

  const missed = [...missedFromBooked, ...missedFromPast];

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
  if (filter === 'complete') return 'completed';
  return 'available';
}

export function mapFilterFromBrowseTab(tab: GuardJobsBrowseTab): GuardMapStatusFilter {
  if (tab === 'completed' || tab === 'missed') return 'complete';
  if (tab === 'scheduled') return 'upcoming';
  return tab;
}
