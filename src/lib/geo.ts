/** Map coordinates — geocoded pins preferred, hash fallback for legacy rows */

export const METRO_CENTER = { lat: 40.758, lng: -73.9855 };

export interface GeoCoords {
  lat: number;
  lng: number;
}

export type JobCoordsSource = Pick<
  { location: string; id?: string; latitude?: number; longitude?: number },
  'location' | 'id' | 'latitude' | 'longitude'
>;

export function jobCoords(job: JobCoordsSource): GeoCoords {
  if (job.latitude != null && job.longitude != null) {
    return { lat: job.latitude, lng: job.longitude };
  }
  return locationToCoords(job.location, job.id);
}

export async function geocodeAddress(query: string): Promise<GeoCoords | null> {
  const trimmed = query.trim();
  if (trimmed.length < 4) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(trimmed)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data.length) return null;
    return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
  } catch {
    return null;
  }
}

export function locationToCoords(location: string, id?: string): GeoCoords {
  let hash = 0;
  const str = `${location}${id ?? ''}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const latOffset = ((hash & 0xffff) / 0xffff - 0.5) * 0.09;
  const lngOffset = (((hash >> 16) & 0xffff) / 0xffff - 0.5) * 0.14;
  return {
    lat: METRO_CENTER.lat + latOffset,
    lng: METRO_CENTER.lng + lngOffset,
  };
}

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Haversine distance in miles between two lat/lng points. */
export function distanceMiles(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const earthRadiusMiles = 3958.8;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(earthRadiusMiles * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * 10) / 10;
}

export function estimateJobDistanceMiles(
  location: string,
  id?: string,
  from: GeoCoords = METRO_CENTER,
  coords?: GeoCoords
): number {
  const jobPoint = coords ?? locationToCoords(location, id);
  return distanceMiles(from, jobPoint);
}

export function jobDistanceMiles(
  job: JobCoordsSource,
  from: GeoCoords = METRO_CENTER
): number {
  return distanceMiles(from, jobCoords(job));
}
