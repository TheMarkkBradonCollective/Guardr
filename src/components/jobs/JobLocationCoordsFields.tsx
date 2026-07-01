import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { MapPin } from 'lucide-react';
import { parseGeoCoords, type GeoCoords } from '../../lib/geo';

export interface JobLocationCoordsFieldsHandle {
  /** Applies valid typed latitude/longitude to the parent form. */
  commitPending: () => GeoCoords | null;
}

interface JobLocationCoordsFieldsProps {
  latitude?: number;
  longitude?: number;
  onCoordsChange: (coords: { lat: number; lng: number } | null) => void;
  /** Staff must add coords before the job can publish. */
  requiredBeforePublish?: boolean;
}

export const JobLocationCoordsFields = forwardRef<
  JobLocationCoordsFieldsHandle,
  JobLocationCoordsFieldsProps
>(function JobLocationCoordsFields(
  { latitude, longitude, onCoordsChange, requiredBeforePublish = false },
  ref
) {
  const [latInput, setLatInput] = useState(latitude != null ? String(latitude) : '');
  const [lngInput, setLngInput] = useState(longitude != null ? String(longitude) : '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLatInput(latitude != null ? String(latitude) : '');
    setLngInput(longitude != null ? String(longitude) : '');
  }, [latitude, longitude]);

  const commitPending = (): GeoCoords | null => {
    const coords = parseGeoCoords(latInput, lngInput);
    if (coords) {
      setError(null);
      onCoordsChange(coords);
      return coords;
    }
    if (latInput.trim() || lngInput.trim()) {
      setError('Enter valid latitude (-90 to 90) and longitude (-180 to 180).');
    }
    return null;
  };

  useImperativeHandle(ref, () => ({ commitPending }), [latInput, lngInput, onCoordsChange]);

  const tryApplyFromInputs = (): boolean => {
    const coords = parseGeoCoords(latInput, lngInput);
    if (!coords) return false;
    setError(null);
    onCoordsChange(coords);
    return true;
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
            ? 'Enter latitude and longitude manually, use current location, or paste from a map pin.'
            : 'Enter latitude and longitude manually, use current location, or leave blank for staff to add before the job goes live.'}
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
            onBlur={() => {
              tryApplyFromInputs();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                tryApplyFromInputs();
              }
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
            onBlur={() => {
              tryApplyFromInputs();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                tryApplyFromInputs();
              }
            }}
            className="uber-input w-full font-mono text-sm"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={tryApplyFromInputs} className="app-button-outline app-btn-sm">
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
});
