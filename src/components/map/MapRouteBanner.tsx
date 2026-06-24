import React from 'react';
import { MapRouteSummary, formatRouteEta } from '../../lib/mapRouting';
import { Navigation, Loader2 } from 'lucide-react';

interface MapRouteBannerProps {
  route: MapRouteSummary | null;
  loading?: boolean;
  label?: string;
}

/** Compact route pill aligned with the map filter toggle row */
export function MapRouteBanner({ route, loading, label = 'To selected offer' }: MapRouteBannerProps) {
  if (!loading && !route) return null;

  return (
    <div className="map-route-banner">
      <Navigation className="w-4 h-4 text-brand-primary shrink-0" />
      {loading ? (
        <p className="map-route-banner-text flex items-center gap-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          Routing…
        </p>
      ) : route ? (
        <p className="map-route-banner-text truncate">
          {label} · {route.distanceMiles} mi · {formatRouteEta(route.durationMinutes)}
        </p>
      ) : null}
    </div>
  );
}
