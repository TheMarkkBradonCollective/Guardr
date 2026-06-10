import React, { useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Loader2, MapPin } from 'lucide-react';
import { GeoCoords, METRO_CENTER, geocodeAddress } from '../../lib/geo';
import { mapTileUrl } from '../../lib/mapTiles';
import { useThemeMode } from '../../lib/platform/useThemeMode';

function DraggablePin({
  position,
  onMove,
}: {
  position: [number, number];
  onMove: (coords: GeoCoords) => void;
}) {
  const icon = L.divIcon({
    className: 'guardr-shift-pin',
    html: '<div class="guardr-shift-pin-inner guardr-shift-pin-selected">📍</div>',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });

  return (
    <Marker
      position={position}
      icon={icon}
      draggable
      eventHandlers={{
        dragend: (e) => {
          const { lat, lng } = e.target.getLatLng();
          onMove({ lat, lng });
        },
      }}
    />
  );
}

function MapClickPin({ onPick }: { onPick: (coords: GeoCoords) => void }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

interface JobLocationPinPickerProps {
  address: string;
  state?: string;
  siteName?: string;
  latitude?: number;
  longitude?: number;
  onCoordsChange: (coords: GeoCoords | null) => void;
}

export function JobLocationPinPicker({
  address,
  state,
  siteName,
  latitude,
  longitude,
  onCoordsChange,
}: JobLocationPinPickerProps) {
  const themeMode = useThemeMode();
  const [geocoding, setGeocoding] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const center = useMemo<[number, number]>(() => {
    if (latitude != null && longitude != null) return [latitude, longitude];
    return [METRO_CENTER.lat, METRO_CENTER.lng];
  }, [latitude, longitude]);

  const hasPin = latitude != null && longitude != null;

  const handleGeocode = async () => {
    const query = [siteName, address, state].filter(Boolean).join(', ');
    if (query.trim().length < 4) {
      setHint('Enter an address first.');
      return;
    }
    setGeocoding(true);
    setHint(null);
    const coords = await geocodeAddress(query);
    setGeocoding(false);
    if (coords) {
      onCoordsChange(coords);
      setHint('Pin updated from address.');
    } else {
      setHint('Address not found — tap the map to place a pin manually.');
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-brand-text-muted flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-brand-primary" />
          Pin on map
        </p>
        <button
          type="button"
          onClick={handleGeocode}
          disabled={geocoding}
          className="app-button-outline !w-auto !h-8 !px-3 !text-xs gap-1.5"
        >
          {geocoding ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          Refresh pin
        </button>
      </div>
      <div className="guardr-map-root h-44 rounded-xl overflow-hidden border border-brand-border">
        <MapContainer center={center} zoom={hasPin ? 15 : 11} className="guardr-map-container h-full" zoomControl={false} attributionControl={false}>
          <TileLayer key={themeMode} url={mapTileUrl(themeMode)} />
          <MapClickPin onPick={onCoordsChange} />
          {hasPin && (
            <DraggablePin
              position={[latitude!, longitude!]}
              onMove={onCoordsChange}
            />
          )}
        </MapContainer>
      </div>
      {hint && <p className="text-xs text-brand-text-muted">{hint}</p>}
      {hasPin && (
        <p className="text-[11px] text-brand-text-muted font-mono">
          {latitude!.toFixed(5)}, {longitude!.toFixed(5)}
        </p>
      )}
    </div>
  );
}
