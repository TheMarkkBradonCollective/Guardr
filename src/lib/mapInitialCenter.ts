/**
 * Where a map opens before (or without) a live GPS fix.
 * Order: live GPS (applied by the map once it arrives) → last known GPS fix on this
 * device → the user's last saved map view → Sacramento (Guardr's launch market).
 */
export const SACRAMENTO_CENTER = { lat: 38.5816, lng: -121.4944 } as const;

export const LAST_KNOWN_LOCATION_KEY = 'guardr_last_known_location';

export interface MapPoint {
  lat: number;
  lng: number;
}

export interface InitialMapView extends MapPoint {
  zoom: number;
  source: 'last-known' | 'saved-view' | 'default';
}

function validPoint(p: unknown): p is MapPoint {
  if (!p || typeof p !== 'object') return false;
  const { lat, lng } = p as Record<string, unknown>;
  return (
    typeof lat === 'number' && typeof lng === 'number' &&
    Number.isFinite(lat) && Number.isFinite(lng) &&
    Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0)
  );
}

export function resolveInitialMapView(options: {
  lastKnown?: unknown;
  savedViewport?: (MapPoint & { zoom?: number }) | null;
  preferLastKnown?: boolean;
}): InitialMapView {
  const { lastKnown, savedViewport, preferLastKnown = false } = options;
  if (preferLastKnown && validPoint(lastKnown)) {
    return { lat: lastKnown.lat, lng: lastKnown.lng, zoom: 14, source: 'last-known' };
  }
  if (savedViewport && validPoint(savedViewport)) {
    const zoom = typeof savedViewport.zoom === 'number' && Number.isFinite(savedViewport.zoom) ? savedViewport.zoom : 13;
    return { lat: savedViewport.lat, lng: savedViewport.lng, zoom, source: 'saved-view' };
  }
  if (validPoint(lastKnown)) {
    return { lat: lastKnown.lat, lng: lastKnown.lng, zoom: 14, source: 'last-known' };
  }
  return { lat: SACRAMENTO_CENTER.lat, lng: SACRAMENTO_CENTER.lng, zoom: 12, source: 'default' };
}

export function loadLastKnownLocation(): MapPoint | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(LAST_KNOWN_LOCATION_KEY) ?? 'null');
    return validPoint(parsed) ? { lat: parsed.lat, lng: parsed.lng } : null;
  } catch {
    return null;
  }
}

export function saveLastKnownLocation(p: MapPoint): void {
  if (!validPoint(p)) return;
  try {
    localStorage.setItem(LAST_KNOWN_LOCATION_KEY, JSON.stringify({ lat: p.lat, lng: p.lng }));
  } catch {
    /* private mode / quota */
  }
}
