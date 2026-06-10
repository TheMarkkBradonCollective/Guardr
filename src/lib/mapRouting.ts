import { GeoCoords } from './geo';

export interface MapRouteSummary {
  points: [number, number][];
  distanceMiles: number;
  durationMinutes: number;
}

/** OSRM public routing — driving path from user to job pin */
export async function fetchDrivingRoute(
  from: GeoCoords,
  to: GeoCoords
): Promise<MapRouteSummary | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      routes?: Array<{
        distance: number;
        duration: number;
        geometry: { coordinates: [number, number][] };
      }>;
    };
    const route = data.routes?.[0];
    if (!route) return null;
    const points = route.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
    return {
      points,
      distanceMiles: Math.round((route.distance / 1609.34) * 10) / 10,
      durationMinutes: Math.max(1, Math.round(route.duration / 60)),
    };
  } catch {
    return null;
  }
}

export function formatRouteEta(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
