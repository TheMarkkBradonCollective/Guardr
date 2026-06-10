import React, { useEffect, useRef, useState } from 'react';
import { Polyline, useMap } from 'react-leaflet';
import { GeoCoords } from '../../lib/geo';
import { fetchDrivingRoute, MapRouteSummary } from '../../lib/mapRouting';
import { mapRoutePathOptions } from '../../lib/mapTiles';
import { useThemeMode } from '../../lib/platform/useThemeMode';

function FitRouteBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    const bounds = points.map(([lat, lng]) => [lat, lng] as [number, number]);
    map.fitBounds(bounds, { padding: [72, 72], maxZoom: 15, animate: true, duration: 0.6 });
  }, [points, map]);
  return null;
}

interface MapRouteLayerProps {
  from: GeoCoords | null;
  to: GeoCoords | null;
  active: boolean;
  onRoute?: (route: MapRouteSummary | null) => void;
}

export function MapRouteLayer({ from, to, active, onRoute }: MapRouteLayerProps) {
  const themeMode = useThemeMode();
  const routeStyle = mapRoutePathOptions(themeMode);
  const [route, setRoute] = useState<MapRouteSummary | null>(null);
  const onRouteRef = useRef(onRoute);
  onRouteRef.current = onRoute;

  useEffect(() => {
    if (!active || !from || !to) {
      setRoute(null);
      onRouteRef.current?.(null);
      return;
    }
    let cancelled = false;
    onRouteRef.current?.(null);
    void fetchDrivingRoute(from, to).then((result) => {
      if (cancelled) return;
      setRoute(result);
      onRouteRef.current?.(result);
    });
    return () => {
      cancelled = true;
    };
  }, [from?.lat, from?.lng, to?.lat, to?.lng, active]);

  if (!route || route.points.length < 2) return null;

  return (
    <>
      <Polyline positions={route.points} pathOptions={routeStyle.main} />
      <Polyline positions={route.points} pathOptions={routeStyle.dash} />
      <FitRouteBounds points={route.points} />
    </>
  );
}
