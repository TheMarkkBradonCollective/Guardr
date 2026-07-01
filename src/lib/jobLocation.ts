import { SecurityRequest } from '../types';
import { buildGeocodeQuery, geocodeAddress } from './geo';

export const JOB_LOCATION_COORDS_MISSING_LABEL = 'No map coordinates';

export const JOB_MAP_COORDS_REQUIRED_MESSAGE =
  'Map coordinates are required before this job can go live. Add latitude and longitude, then approve.';

export function jobMapCoordsApprovalBlocker(
  job: Pick<SecurityRequest, 'latitude' | 'longitude'>
): string | null {
  return isJobLocationCoordsMissing(job) ? JOB_MAP_COORDS_REQUIRED_MESSAGE : null;
}

/** Jobs need map pins for guard browse, distance, and on-site clock-in. */
export function jobMayPublishToMarketplace(
  job: Pick<SecurityRequest, 'latitude' | 'longitude' | 'status'>
): boolean {
  return hasJobCoordinates(job);
}

export function hasJobCoordinates(
  job: Pick<SecurityRequest, 'latitude' | 'longitude'>
): boolean {
  return job.latitude != null && job.longitude != null;
}

export async function resolveJobMapCoordinates(
  job: Pick<SecurityRequest, 'latitude' | 'longitude' | 'siteName' | 'address' | 'state' | 'location'>
): Promise<{ latitude?: number; longitude?: number }> {
  if (hasJobCoordinates(job)) {
    return { latitude: job.latitude, longitude: job.longitude };
  }
  const query = buildGeocodeQuery({
    siteName: job.siteName,
    address: job.address || job.location,
    state: job.state,
  });
  if (!query || query === 'To Be Confirmed') return {};
  const geocoded = await geocodeAddress(query);
  if (!geocoded) return {};
  return { latitude: geocoded.lat, longitude: geocoded.lng };
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
