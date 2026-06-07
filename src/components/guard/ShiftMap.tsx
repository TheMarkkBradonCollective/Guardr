import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { SecurityRequest } from '../../types';
import { locationToCoords, METRO_CENTER } from '../../lib/geo';
import { getGuardHourlyPay } from '../../lib/guardJobs';

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
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

interface ShiftMapProps {
  jobs: SecurityRequest[];
  selectedJobId: string | null;
  onSelectJob: (jobId: string | null) => void;
  guardPosition?: { lat: number; lng: number } | null;
  className?: string;
}

export function ShiftMap({
  jobs,
  selectedJobId,
  onSelectJob,
  guardPosition,
  className = '',
}: ShiftMapProps) {
  const jobPins = useMemo(
    () =>
      jobs.map((job) => ({
        job,
        coords: locationToCoords(job.location, job.id),
      })),
    [jobs]
  );

  const mapCenter: [number, number] = useMemo(() => {
    if (selectedJobId) {
      const pin = jobPins.find((p) => p.job.id === selectedJobId);
      if (pin) return [pin.coords.lat, pin.coords.lng];
    }
    if (guardPosition) return [guardPosition.lat, guardPosition.lng];
    if (jobPins.length > 0) return [jobPins[0].coords.lat, jobPins[0].coords.lng];
    return [METRO_CENTER.lat, METRO_CENTER.lng];
  }, [selectedJobId, jobPins, guardPosition]);

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

        {guardPosition && (
          <>
            <Circle
              center={[guardPosition.lat, guardPosition.lng]}
              radius={800}
              pathOptions={{ color: '#84a279', fillColor: '#84a279', fillOpacity: 0.08, weight: 1 }}
            />
            <Marker position={[guardPosition.lat, guardPosition.lng]} icon={guardIcon} />
          </>
        )}

        {jobPins.map(({ job, coords }) => (
          <Marker
            key={job.id}
            position={[coords.lat, coords.lng]}
            icon={createShiftIcon(getGuardHourlyPay(job), selectedJobId === job.id, job.armedRequired)}
            eventHandlers={{
              click: () => onSelectJob(selectedJobId === job.id ? null : job.id),
            }}
          >
            <Popup className="guardr-map-popup">
              <div className="text-xs font-mono space-y-1 min-w-[180px]">
                <p className="font-bold text-black uppercase text-[10px]">{job.title}</p>
                <p className="text-neutral-600">{job.location}</p>
                <p className="text-brand-primary font-black">${getGuardHourlyPay(job)}/hr</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
