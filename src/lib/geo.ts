/** Deterministic coordinates from location text for map pins */

export const METRO_CENTER = { lat: 40.758, lng: -73.9855 };

export function locationToCoords(location: string, id?: string): { lat: number; lng: number } {
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

export function estimateJobDistanceMiles(location: string, id?: string): number {
  return distanceMiles(METRO_CENTER, locationToCoords(location, id));
}
