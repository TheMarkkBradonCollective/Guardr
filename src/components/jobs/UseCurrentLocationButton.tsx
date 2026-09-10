import React, { useState } from 'react';
import { Loader2, LocateFixed } from 'lucide-react';
import { locateCurrentJobSite } from '../../lib/deviceLocation';
import type { GeoCoords } from '../../lib/geo';
import { userFacingError } from '../../lib/userFacingError';

export interface CurrentLocationResult {
  coords: GeoCoords;
  addressLine?: string;
  stateCode?: string;
}

interface UseCurrentLocationButtonProps {
  onLocated: (result: CurrentLocationResult) => void;
  className?: string;
  label?: string;
}

export function UseCurrentLocationButton({
  onLocated,
  className = '',
  label = 'Use current location',
}: UseCurrentLocationButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await locateCurrentJobSite();
      onLocated({
        coords: result.coords,
        addressLine: result.addressLine ?? undefined,
        stateCode: result.stateCode ?? undefined,
      });
    } catch (err) {
      setError(userFacingError(err, 'Unable to get your location.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={loading}
        className="app-button-outline app-btn-sm gap-1.5 w-full sm:w-auto"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <LocateFixed className="w-3.5 h-3.5" />
        )}
        {loading ? 'Getting location…' : label}
      </button>
      {error && <p className="text-xs text-red-400 mt-1.5 leading-relaxed">{error}</p>}
    </div>
  );
}
