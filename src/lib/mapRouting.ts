import { GeoCoords } from './geo';

export interface MapRouteSummary {
  points: [number, number][];
  distanceMiles: number;
  durationMinutes: number;
}

const routeCache = new Map<string, MapRouteSummary>();

/** Stable cache key (~11m precision) so GPS drift does not bust the cache. */
export function drivingRouteCacheKey(from: GeoCoords, to: GeoCoords): string {
  const round = (n: number) => n.toFixed(4);
  return `${round(from.lat)},${round(from.lng)}->${round(to.lat)},${round(to.lng)}`;
}

/** OSRM public routing — driving path from user to job pin */
export async function fetchDrivingRoute(
  from: GeoCoords,
  to: GeoCoords
): Promise<MapRouteSummary | null> {
  const cacheKey = drivingRouteCacheKey(from, to);
  const cached = routeCache.get(cacheKey);
  if (cached) return cached;

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
    const summary: MapRouteSummary = {
      points,
      distanceMiles: Math.round((route.distance / 1609.34) * 10) / 10,
      durationMinutes: Math.max(1, Math.round(route.duration / 60)),
    };
    routeCache.set(cacheKey, summary);
    return summary;
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
