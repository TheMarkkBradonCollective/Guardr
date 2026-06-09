import { useEffect, useState } from 'react';

export interface GeoPosition {
  lat: number;
  lng: number;
}

/** Request device location once when a map (or other view) mounts. */
export function useUserLocation(): GeoPosition | null {
  const [position, setPosition] = useState<GeoPosition | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setPosition(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 }
    );
  }, []);

  return position;
}
