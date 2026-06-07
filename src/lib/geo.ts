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
