import { useCallback, useRef, useState } from 'react';
import type { JobLocationCoordsFieldsHandle } from './JobLocationCoordsFields';
import type { GeoCoords } from '../../lib/geo';

export function useJobLocationCoords(initial?: { latitude?: number; longitude?: number }) {
  const [latitude, setLatitude] = useState<number | undefined>(initial?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(initial?.longitude);
  const coordsFieldsRef = useRef<JobLocationCoordsFieldsHandle>(null);

  const onCoordsChange = useCallback((coords: GeoCoords | null) => {
    if (coords) {
      setLatitude(coords.lat);
      setLongitude(coords.lng);
      return;
    }
    setLatitude(undefined);
    setLongitude(undefined);
  }, []);

  const applyLocatedCoords = useCallback((coords: GeoCoords) => {
    setLatitude(coords.lat);
    setLongitude(coords.lng);
  }, []);

  /** Commits typed manual latitude/longitude before submit or step advance. */
  const resolveCoordsForSubmit = useCallback((): { latitude?: number; longitude?: number } => {
    const pending = coordsFieldsRef.current?.commitPending();
    const lat = pending?.lat ?? latitude;
    const lng = pending?.lng ?? longitude;
    if (pending) {
      setLatitude(pending.lat);
      setLongitude(pending.lng);
    }
    return { latitude: lat, longitude: lng };
  }, [latitude, longitude]);

  const resetCoords = useCallback(() => {
    setLatitude(undefined);
    setLongitude(undefined);
  }, []);

  return {
    latitude,
    longitude,
    coordsFieldsRef,
    onCoordsChange,
    applyLocatedCoords,
    resolveCoordsForSubmit,
    resetCoords,
  };
}
