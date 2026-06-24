import { requestDevicePosition } from './deviceLocation';
import { jobCoords, type JobCoordsSource } from './geo';

/** Maximum distance from job site pin for clock-in and on-site arrival. */
export const ON_SITE_RADIUS_METERS = 150;

export interface Coordinates {
  lat: number;
  lng: number;
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Haversine distance in meters between two WGS84 points. */
export function distanceMeters(a: Coordinates, b: Coordinates): number {
  const earthRadiusM = 6_371_000;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * earthRadiusM * Math.asin(Math.sqrt(h));
}

export function jobHasSiteCoordinates(
  job: Pick<JobCoordsSource, 'latitude' | 'longitude'>
): boolean {
  return (
    typeof job.latitude === 'number' &&
    typeof job.longitude === 'number' &&
    Number.isFinite(job.latitude) &&
    Number.isFinite(job.longitude)
  );
}

export function isWithinSiteRadius(
  user: Coordinates,
  job: JobCoordsSource,
  radiusMeters = ON_SITE_RADIUS_METERS
): boolean {
  if (!jobHasSiteCoordinates(job)) return false;
  const site = jobCoords(job);
  return distanceMeters(user, site) <= radiusMeters;
}

export async function verifyOnSiteForJob(
  job: JobCoordsSource,
  radiusMeters = ON_SITE_RADIUS_METERS
): Promise<{ onSite: boolean; position: Coordinates | null; distanceMeters: number | null }> {
  if (!jobHasSiteCoordinates(job)) {
    return { onSite: false, position: null, distanceMeters: null };
  }
  const position = await requestDevicePosition();
  if (!position) {
    return { onSite: false, position: null, distanceMeters: null };
  }
  const site = jobCoords(job);
  const dist = distanceMeters(position, site);
  return {
    onSite: dist <= radiusMeters,
    position,
    distanceMeters: Math.round(dist),
  };
}

export function formatSiteProximityHint(distanceMeters: number | null, radiusMeters = ON_SITE_RADIUS_METERS): string {
  if (distanceMeters == null) {
    return 'Enable location services and move within range of the job site pin.';
  }
  if (distanceMeters <= radiusMeters) {
    return 'You are on site.';
  }
  const feet = Math.round(distanceMeters * 3.28084);
  return `Move closer — about ${feet.toLocaleString()} ft from the site pin (${radiusMeters}m required).`;
}
