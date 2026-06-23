import { SecurityRequest } from '../types';

export const JOB_LOCATION_COORDS_MISSING_LABEL = 'No map coordinates';

export function hasJobCoordinates(
  job: Pick<SecurityRequest, 'latitude' | 'longitude'>
): boolean {
  return job.latitude != null && job.longitude != null;
}

export function isJobLocationCoordsMissing(
  job: Pick<SecurityRequest, 'latitude' | 'longitude'>
): boolean {
  return !hasJobCoordinates(job);
}

export function jobsMissingMapCoordinates(requests: SecurityRequest[]): SecurityRequest[] {
  return requests.filter(
    (r) =>
      isJobLocationCoordsMissing(r) &&
      r.status !== 'closed' &&
      r.status !== 'completed'
  );
}
