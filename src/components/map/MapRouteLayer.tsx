import React, { useEffect, useRef } from 'react';
import { Polyline, useMap } from 'react-leaflet';
import { GeoCoords } from '../../lib/geo';
import { drivingRouteCacheKey, fetchDrivingRoute, MapRouteSummary } from '../../lib/mapRouting';
import { mapRoutePathOptions } from '../../lib/mapTiles';
import { useThemeMode } from '../../lib/platform/useThemeMode';
import { useMapViewportInsets } from '../../lib/mapViewportInsets';

function FitRouteBounds({
  routeKey,
  points,
  resetKey,
}: {
  routeKey: string;
  points: [number, number][];
  /** Changes when selection changes — resets user-moved lock and triggers fit. */
  resetKey: string;
}) {
  const map = useMap();
  const { insets, userMoved, resetUserMoved } = useMapViewportInsets();
  const lastRouteKeyRef = useRef<string | null>(null);
  const lastInsetsRef = useRef(insets);
  const prevResetKeyRef = useRef(resetKey);

  useEffect(() => {
    if (resetKey !== prevResetKeyRef.current) {
      prevResetKeyRef.current = resetKey;
      resetUserMoved();
      lastRouteKeyRef.current = null;
    }
  }, [resetKey, resetUserMoved]);

  useEffect(() => {
    if (points.length < 2) return;

    const insetsChanged =
      insets.top !== lastInsetsRef.current.top ||
      insets.bottom !== lastInsetsRef.current.bottom ||
      insets.left !== lastInsetsRef.current.left ||
      insets.right !== lastInsetsRef.current.right;
    lastInsetsRef.current = insets;

    const isNewRoute = lastRouteKeyRef.current !== routeKey;
    if (userMoved && !insetsChanged && !isNewRoute) return;

    lastRouteKeyRef.current = routeKey;

    const bounds = points.map(([lat, lng]) => [lat, lng] as [number, number]);
    const raf = requestAnimationFrame(() => {
      map.fitBounds(bounds, {
        paddingTopLeft: [insets.left + 32, insets.top + 24],
        paddingBottomRight: [insets.right + 32, insets.bottom + 20],
        maxZoom: 15,
        animate: true,
        duration: 0.55,
      });
    });

    return () => cancelAnimationFrame(raf);
  }, [routeKey, points, insets, userMoved, map]);

  return null;
}

interface MapRouteLayerProps {
  from: GeoCoords | null;
  to: GeoCoords | null;
  active: boolean;
  onRoute?: (route: MapRouteSummary | null) => void;
  /** Resets auto-fit when the selected job changes. */
  fitResetKey?: string;
}

export function MapRouteLayer({ from, to, active, onRoute, fitResetKey = '' }: MapRouteLayerProps) {
  const themeMode = useThemeMode();
  const routeStyle = mapRoutePathOptions(themeMode);
  const [route, setRoute] = React.useState<MapRouteSummary | null>(null);
  const onRouteRef = React.useRef(onRoute);
  onRouteRef.current = onRoute;

  React.useEffect(() => {
    if (!active || !from || !to) {
      setRoute(null);
      onRouteRef.current?.(null);
      return;
    }

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
      <FitRouteBounds routeKey={routeKey} points={route.points} resetKey={fitResetKey || routeKey} />
    </>
  );
}
