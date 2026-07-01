import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { parseGeoCoords } from '../../lib/geo';

interface JobLocationCoordsFieldsProps {
  latitude?: number;
  longitude?: number;
  onCoordsChange: (coords: { lat: number; lng: number } | null) => void;
  /** Staff must add coords before the job can publish. */
  requiredBeforePublish?: boolean;
}

export function JobLocationCoordsFields({
  latitude,
  longitude,
  onCoordsChange,
  requiredBeforePublish = false,
}: JobLocationCoordsFieldsProps) {
  const [latInput, setLatInput] = useState(latitude != null ? String(latitude) : '');
  const [lngInput, setLngInput] = useState(longitude != null ? String(longitude) : '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLatInput(latitude != null ? String(latitude) : '');
    setLngInput(longitude != null ? String(longitude) : '');
  }, [latitude, longitude]);

  const applyCoords = () => {
    const coords = parseGeoCoords(latInput, lngInput);
    if (!coords) {
      setError('Enter valid latitude (-90 to 90) and longitude (-180 to 180).');
      return;
    }
    setError(null);
    onCoordsChange(coords);
  };

  const clearCoords = () => {
    setLatInput('');
    setLngInput('');
    setError(null);
    onCoordsChange(null);
  };

  const hasCoords = latitude != null && longitude != null;

  return (
    <div className="space-y-2 border-t border-brand-border pt-3">
      <div>
        <p className="text-xs font-medium text-brand-text-muted flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-brand-primary" />
          Map coordinates {requiredBeforePublish ? '(required)' : '(recommended)'}
        </p>
        <p className="text-[11px] text-brand-text-muted mt-1 leading-snug">
          {requiredBeforePublish
            ? 'Latitude and longitude are required before this job can go live on the map.'
            : 'Use current location or enter manually. If you skip this, staff will add coordinates before your job goes live.'}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="uber-label block mb-1">Latitude</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="e.g. 34.05223"
            value={latInput}
            onChange={(e) => {
              setLatInput(e.target.value);
              setError(null);
            }}
            className="uber-input w-full font-mono text-sm"
          />
        </div>
        <div>
          <label className="uber-label block mb-1">Longitude</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="e.g. -118.24368"
            value={lngInput}
            onChange={(e) => {
              setLngInput(e.target.value);
              setError(null);
            }}
            className="uber-input w-full font-mono text-sm"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={applyCoords} className="app-button-outline app-btn-sm">
          Apply coordinates
        </button>
        {hasCoords && (
          <button
            type="button"
            onClick={clearCoords}
            className="app-button-outline app-btn-sm text-brand-text-muted"
          >
            Clear
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hasCoords && (
        <p className="text-[11px] text-emerald-400/90 font-mono">
          {latitude!.toFixed(5)}, {longitude!.toFixed(5)}
        </p>
      )}
    </div>
  );
}
