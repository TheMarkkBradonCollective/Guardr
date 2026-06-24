import type { SecurityRequest } from '../types';
import type { GuardJobView } from './guardJobView';
import {
  guardJobMatchesMapStatusFilter,
  guardMapPinKind,
  guardVisibleMapJobs,
  type GuardMapStatusFilter,
} from './mapJobVisibility';

/** Shared guard job buckets — list (Jobs tab) and map pins use the same data. */
export type GuardJobsBrowseTab = 'available' | 'upcoming' | 'past';

export interface GuardBrowseJobLists {
  all: GuardJobView[];
  available: GuardJobView[];
  upcoming: GuardJobView[];
  past: GuardJobView[];
}

/** Jobs visible on map / Jobs tab (excludes in-progress — active shift uses overlay). */
export function getGuardBrowseJobLists(
  guardId: string,
  jobs: GuardJobView[]
): GuardBrowseJobLists {
  const requests = jobs as unknown as SecurityRequest[];
  const all = guardVisibleMapJobs(guardId, requests, jobs).filter(
    (job) => job.status !== 'in-progress'
  );
  const available = all.filter((job) => guardMapPinKind(guardId, job as unknown as SecurityRequest) === 'available');
  const upcoming = all.filter((job) => guardMapPinKind(guardId, job as unknown as SecurityRequest) === 'scheduled');
  const past = all.filter((job) => guardMapPinKind(guardId, job as unknown as SecurityRequest) === 'past');
  return { all, available, upcoming, past };
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
  if (filter === 'upcoming') return 'upcoming';
  if (filter === 'complete') return 'past';
  return 'available';
}

export function mapFilterFromBrowseTab(tab: GuardJobsBrowseTab): GuardMapStatusFilter {
  if (tab === 'past') return 'complete';
  return tab;
}
