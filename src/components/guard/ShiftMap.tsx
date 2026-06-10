import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { SecurityRequest } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { jobCoords, METRO_CENTER } from '../../lib/geo';
import { JOB_TYPE_LABELS } from '../../lib/guardJobs';
import { useUserLocation } from '../../lib/useUserLocation';

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

type ShiftMapJob = GuardJobView | SecurityRequest;

interface ShiftMapProps {
  jobs: ShiftMapJob[];
  selectedJobId: string | null;
  onSelectJob: (jobId: string | null) => void;
  className?: string;
  /** Guards see their pay rate; staff ops map shows client billing rate */
  pinMode?: 'guard' | 'staff';
}

function pinHourlyRate(job: ShiftMapJob, pinMode: 'guard' | 'staff'): number {
  if (pinMode === 'staff' && 'hourlyRate' in job) {
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
}: ShiftMapProps) {
  const userLocation = useUserLocation();
  const jobPins = useMemo(
    () =>
      jobs.map((job) => ({
        job,
        coords: jobCoords(job),
      })),
    [jobs]
  );

  const mapCenter: [number, number] = useMemo(() => {
    if (selectedJobId) {
      const pin = jobPins.find((p) => p.job.id === selectedJobId);
      if (pin) return [pin.coords.lat, pin.coords.lng];
    }
    if (userLocation) return [userLocation.lat, userLocation.lng];
    return [METRO_CENTER.lat, METRO_CENTER.lng];
  }, [selectedJobId, jobPins, userLocation]);

  const guardIcon = L.divIcon({
    className: 'guardr-guard-pin',
    html: `<div class="guardr-guard-pin-inner"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });

  return (
    <div className={`guardr-map-root ${className}`}>
      <MapContainer
        center={mapCenter}
        zoom={13}
        zoomControl={false}
        className="guardr-map-container"
        attributionControl={false}
      >
        <MapRecenter center={mapCenter} zoom={selectedJobId ? 14 : 13} />
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

        {userLocation && (
          <>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={800}
              pathOptions={{ color: '#84a279', fillColor: '#84a279', fillOpacity: 0.08, weight: 1 }}
            />
            <Marker position={[userLocation.lat, userLocation.lng]} icon={guardIcon} />
          </>
        )}

        {jobPins.map(({ job, coords }) => (
          <Marker
            key={job.id}
            position={[coords.lat, coords.lng]}
            icon={createShiftIcon(pinHourlyRate(job, pinMode), selectedJobId === job.id, job.armedRequired)}
            eventHandlers={{
              click: () => onSelectJob(selectedJobId === job.id ? null : job.id),
            }}
          >
            <Popup className="guardr-map-popup">
              <div className="text-xs space-y-1.5 min-w-[200px] max-w-[240px]">
                <p className="font-bold text-black text-[11px] leading-tight">{job.title}</p>
                <p className="text-neutral-600 text-[10px]">{JOB_TYPE_LABELS[job.type]}{job.armedRequired ? ' · Armed' : ''}</p>
                <p className="text-neutral-600 text-[10px]">{job.siteName || job.location}</p>
                {job.uniformRequirements && (
                  <p className="text-neutral-500 text-[9px] line-clamp-2">Dress: {job.uniformRequirements}</p>
                )}
                <p className="text-brand-primary font-black text-sm">
                  ${pinHourlyRate(job, pinMode)}/hr
                  {pinMode === 'staff' && 'estimatedPayout' in job ? (
                    <span className="block text-[9px] text-neutral-500 font-normal">
                      Client bill ${(job as SecurityRequest).estimatedPayout}
                    </span>
                  ) : null}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
