import React, { useEffect, useRef, useState } from 'react';
import { Polyline, useMap } from 'react-leaflet';
import { GeoCoords } from '../../lib/geo';
import { drivingRouteCacheKey, fetchDrivingRoute, MapRouteSummary } from '../../lib/mapRouting';
import { mapRoutePathOptions } from '../../lib/mapTiles';
import { useThemeMode } from '../../lib/platform/useThemeMode';

function FitRouteBounds({ routeKey, points }: { routeKey: string; points: [number, number][] }) {
  const map = useMap();
  const fittedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (points.length < 2) return;
    if (fittedKeyRef.current === routeKey) return;
    fittedKeyRef.current = routeKey;
    const bounds = points.map(([lat, lng]) => [lat, lng] as [number, number]);
    map.fitBounds(bounds, { padding: [72, 72], maxZoom: 15, animate: true, duration: 0.6 });
  }, [routeKey, points, map]);

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

    const routeKey = drivingRouteCacheKey(from, to);
    let cancelled = false;

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

  const routeKey = drivingRouteCacheKey(from!, to!);

  return (
    <>
      <Polyline positions={route.points} pathOptions={routeStyle.main} />
      <Polyline positions={route.points} pathOptions={routeStyle.dash} />
      <FitRouteBounds routeKey={routeKey} points={route.points} />
    </>
  );
}
