import { useEffect, useState } from 'react';

export interface GeoPosition {
  lat: number;
  lng: number;
}

/** Device location for map routing — optional live watch (Uber-style). */
export function useUserLocation(watch = false): GeoPosition | null {
  const [position, setPosition] = useState<GeoPosition | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const opts: PositionOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 30_000 };
    const onOk = (pos: GeolocationPosition) =>
      setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    const onErr = () => setPosition(null);

    if (watch) {
      const id = navigator.geolocation.watchPosition(onOk, onErr, opts);
      return () => navigator.geolocation.clearWatch(id);
    }

    navigator.geolocation.getCurrentPosition(onOk, onErr, opts);
  }, [watch]);

  return position;
}
