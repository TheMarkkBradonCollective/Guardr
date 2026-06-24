import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { SecurityRequest } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { jobCoords, METRO_CENTER } from '../../lib/geo';
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

function createShiftIcon(hourlyPay: number, selected: boolean, armed: boolean) {
  return L.divIcon({
    className: 'guardr-shift-pin',
    html: `<div class="guardr-shift-pin-inner ${selected ? 'guardr-shift-pin-selected' : ''} ${armed ? 'guardr-shift-pin-armed' : ''}">$${hourlyPay}</div>`,
    iconSize: [48, 48],
    iconAnchor: [24, 24],
  });
}

function MapRecenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { animate: true, duration: 0.75 });
  }, [center, zoom, map]);
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
}: ShiftMapProps) {
  const themeMode = useThemeMode();
  const userLocation = useUserLocation(true);
  const userLocStyle = mapUserLocationColors(themeMode);

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

  const savedViewport = useMemo(() => loadSavedViewport(), []);

  const mapCenter: [number, number] = useMemo(() => {
    if (selectedPin) return [selectedPin.coords.lat, selectedPin.coords.lng];
    if (userLocation) return [userLocation.lat, userLocation.lng];
    if (savedViewport) return [savedViewport.lat, savedViewport.lng];
    return [METRO_CENTER.lat, METRO_CENTER.lng];
  }, [selectedPin, userLocation, savedViewport]);

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
    if (drawRoute && selectedPin && userLocation) {
      onRouteLoadingChange?.(true);
    } else {
      onRouteLoadingChange?.(false);
      onRouteChange?.(null);
    }
  }, [selectedJobId, drawRoute, selectedPin, userLocation, onRouteChange, onRouteLoadingChange]);

  return (
    <div className={`guardr-map-root ${className}`}>
      <MapContainer
        center={mapCenter}
        zoom={initialZoom}
        zoomControl={false}
        className="guardr-map-container"
        attributionControl={false}
      >
        <MapViewportSaver />
        {!selectedPin && <MapRecenter center={mapCenter} zoom={userLocation ? 13 : savedViewport?.zoom ?? 12} />}
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

        {drawRoute && userLocation && selectedPin && (
          <MapRouteLayer
            from={userLocation}
            to={selectedPin.coords}
            active
            onRoute={handleRouteChange}
          />
        )}

        {jobPins.map(({ job, coords }) => (
          <Marker
            key={job.id}
            position={[coords.lat, coords.lng]}
            icon={createShiftIcon(pinHourlyRate(job, pinMode), selectedJobId === job.id, job.armedRequired)}
            eventHandlers={{
              click: () => onSelectJob(selectedJobId === job.id ? null : job.id),
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
}

export type { ShiftMapJob };
