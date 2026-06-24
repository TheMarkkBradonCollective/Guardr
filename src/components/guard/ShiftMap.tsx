import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { SecurityRequest } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { jobCoords, METRO_CENTER } from '../../lib/geo';
import type { GeoCoords } from '../../lib/geo';
import { hasJobCoordinates } from '../../lib/jobLocation';
import { useUserLocation } from '../../lib/useUserLocation';
import { mapTileUrl, mapUserLocationColors } from '../../lib/mapTiles';
import { useThemeMode } from '../../lib/platform/useThemeMode';
import { MapRouteLayer } from '../map/MapRouteLayer';
import { MapRouteSummary } from '../../lib/mapRouting';

const MAP_VIEWPORT_KEY = 'guardr_map_viewport';

interface SavedViewport {
  lat: number;
  lng: number;
  zoom: number;
}

function loadSavedViewport(): SavedViewport | null {
  try {
    const raw = localStorage.getItem(MAP_VIEWPORT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedViewport;
    if (
      typeof parsed.lat === 'number' &&
      typeof parsed.lng === 'number' &&
      typeof parsed.zoom === 'number'
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

function createShiftIcon(hourlyPay: number, selected: boolean, armed: boolean, kind?: string | null) {
  // All modifier classes go on the outer div so that CSS descendant selectors work:
  //   .guardr-shift-pin-selected .guardr-shift-pin-inner { ... }
  const mods = [
    kind ? `guardr-shift-pin-kind--${kind}` : '',
    selected ? 'guardr-shift-pin-selected' : '',
    armed ? 'guardr-shift-pin-armed' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return L.divIcon({
    className: `guardr-shift-pin${mods ? ` ${mods}` : ''}`,
    html: `<div class="guardr-shift-pin-inner">$${hourlyPay}</div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
}

interface MapControllerProps {
  selectedPin: { coords: { lat: number; lng: number }; job: { id: string } } | null;
  userLocation: { lat: number; lng: number } | null;
  hadSavedViewport: boolean;
  recenterRef: React.MutableRefObject<(() => void) | null>;
}

/**
 * SBN-style map controller: centers once on first GPS fix (if no saved viewport),
 * flies to a pin when it is first selected, and exposes a recenter callback for the
 * locate button. Does NOT auto-follow the user — free roam otherwise.
 */
function MapController({ selectedPin, userLocation, hadSavedViewport, recenterRef }: MapControllerProps) {
  const map = useMap();
  const prevSelectedPinIdRef = useRef<string | null>(null);
  const hasInitialGPSCenteredRef = useRef(false);

  // Keep the recenter callback current so the locate button always flies to latest position
  useEffect(() => {
    recenterRef.current = () => {
      if (userLocation) {
        map.flyTo([userLocation.lat, userLocation.lng], 14, { animate: true, duration: 0.75 });
      }
    };
  }, [userLocation, map, recenterRef]);

  // Center once on the first GPS fix — only when there is no saved viewport (fresh session)
  useEffect(() => {
    if (userLocation && !hasInitialGPSCenteredRef.current) {
      hasInitialGPSCenteredRef.current = true;
      if (!hadSavedViewport) {
        map.flyTo([userLocation.lat, userLocation.lng], 14, { animate: true, duration: 0.75 });
      }
    }
  }, [userLocation, map, hadSavedViewport]);

  // Fly to a pin the moment it becomes selected (not on every re-render)
  useEffect(() => {
    if (selectedPin && selectedPin.job.id !== prevSelectedPinIdRef.current) {
      map.flyTo([selectedPin.coords.lat, selectedPin.coords.lng], 14, { animate: true, duration: 0.75 });
    }
    prevSelectedPinIdRef.current = selectedPin?.job.id ?? null;
  }, [selectedPin, map]);

  return null;
}

function MapViewportSaver() {
  useMapEvents({
    moveend(e) {
      const { lat, lng } = e.target.getCenter();
      const zoom = e.target.getZoom();
      try {
        localStorage.setItem(MAP_VIEWPORT_KEY, JSON.stringify({ lat, lng, zoom }));
      } catch {
        /* private browsing / storage quota */
      }
    },
  });
  return null;
}

type ShiftMapJob = GuardJobView | SecurityRequest;

interface ShiftMapProps {
  jobs: ShiftMapJob[];
  selectedJobId: string | null;
  onSelectJob: (jobId: string | null) => void;
  className?: string;
  pinMode?: 'guard' | 'staff' | 'client';
  /** Draw driving route from user to selected pin */
  drawRoute?: boolean;
  onRouteChange?: (route: MapRouteSummary | null) => void;
  onRouteLoadingChange?: (loading: boolean) => void;
  /** Return the status kind for a job to color-code its blip. Return null to use the default brand color. */
  getPinKind?: (job: ShiftMapJob) => string | null;
}

function pinHourlyRate(job: ShiftMapJob, pinMode: 'guard' | 'staff' | 'client'): number {
  if (pinMode !== 'guard' && 'hourlyRate' in job) {
    return (job as SecurityRequest).hourlyRate;
  }
  return 'guardPay' in job ? job.guardPay : 0;
}

export function ShiftMap({
  jobs,
  selectedJobId,
  onSelectJob,
  className = '',
  pinMode = 'guard',
  drawRoute = true,
  onRouteChange,
  onRouteLoadingChange,
  getPinKind,
}: ShiftMapProps) {
  const themeMode = useThemeMode();
  const userLocation = useUserLocation(true);
  const userLocStyle = mapUserLocationColors(themeMode);
  const recenterRef = useRef<(() => void) | null>(null);

  const jobPins = useMemo(
    () =>
      jobs
        .filter((job) => hasJobCoordinates(job))
        .map((job) => ({
          job,
          coords: jobCoords(job),
        })),
    [jobs]
  );

  const selectedPin = useMemo(
    () => jobPins.find((p) => p.job.id === selectedJobId) ?? null,
    [jobPins, selectedJobId]
  );

  /** Snapshot GPS at pin selection so live watch updates do not re-fetch the route. */
  const [routeFrom, setRouteFrom] = useState<GeoCoords | null>(null);
  const prevSelectedJobIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (selectedJobId !== prevSelectedJobIdRef.current) {
      prevSelectedJobIdRef.current = selectedJobId;
      if (!selectedJobId) {
        setRouteFrom(null);
      } else if (userLocation) {
        setRouteFrom({ lat: userLocation.lat, lng: userLocation.lng });
      } else {
        setRouteFrom(null);
      }
      return;
    }

    if (selectedJobId && userLocation && routeFrom === null) {
      setRouteFrom({ lat: userLocation.lat, lng: userLocation.lng });
    }
  }, [selectedJobId, userLocation, routeFrom]);

  // Computed once at mount — MapContainer only uses center/zoom props for initial placement
  const savedViewport = useMemo(() => loadSavedViewport(), []);
  const hadSavedViewport = useMemo(() => !!savedViewport, [savedViewport]);

  const initialCenter: [number, number] = useMemo(
    () =>
      savedViewport
        ? [savedViewport.lat, savedViewport.lng]
        : [METRO_CENTER.lat, METRO_CENTER.lng],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // intentionally once — MapContainer ignores center prop changes after mount
  );
  const initialZoom = savedViewport?.zoom ?? 13;

  const guardIcon = L.divIcon({
    className: 'guardr-guard-pin',
    html: `<div class="guardr-guard-pin-inner"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  const handleRouteChange = (route: MapRouteSummary | null) => {
    onRouteLoadingChange?.(false);
    onRouteChange?.(route);
  };

  useEffect(() => {
    if (!drawRoute || !selectedPin || !routeFrom) {
      if (!selectedPin) {
        onRouteLoadingChange?.(false);
        onRouteChange?.(null);
      }
      return;
    }
    onRouteLoadingChange?.(true);
  }, [selectedJobId, drawRoute, selectedPin, routeFrom, onRouteChange, onRouteLoadingChange]);

  return (
    <div className={`guardr-map-root ${className}`}>
      <MapContainer
        center={initialCenter}
        zoom={initialZoom}
        zoomControl={false}
        className="guardr-map-container"
        attributionControl={false}
      >
        <MapViewportSaver />
        <MapController
          selectedPin={selectedPin}
          userLocation={userLocation}
          hadSavedViewport={hadSavedViewport}
          recenterRef={recenterRef}
        />
        <TileLayer key={themeMode} url={mapTileUrl(themeMode)} />

        {userLocation && (
          <>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={800}
              pathOptions={{
                color: userLocStyle.ring,
                fillColor: userLocStyle.fill,
                fillOpacity: userLocStyle.fillOpacity,
                weight: 1,
              }}
            />
            <Marker position={[userLocation.lat, userLocation.lng]} icon={guardIcon} />
          </>
        )}

        {drawRoute && routeFrom && selectedPin && (
          <MapRouteLayer
            from={routeFrom}
            to={selectedPin.coords}
            active
            onRoute={handleRouteChange}
          />
        )}

        {jobPins.map(({ job, coords }) => (
          <Marker
            key={job.id}
            position={[coords.lat, coords.lng]}
            icon={createShiftIcon(
              pinHourlyRate(job, pinMode),
              selectedJobId === job.id,
              job.armedRequired,
              getPinKind?.(job) ?? null
            )}
            eventHandlers={{
              click: () => onSelectJob(selectedJobId === job.id ? null : job.id),
            }}
          />
        ))}
      </MapContainer>

      {userLocation && (
        <button
          type="button"
          className="guardr-map-locate-btn"
          onClick={() => recenterRef.current?.()}
          aria-label="Center map on my location"
        >
          {/* Crosshair / locate icon */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
          </svg>
        </button>
      )}
    </div>
  );
}

export type { ShiftMapJob };
