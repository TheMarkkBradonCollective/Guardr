import React from 'react';
import { MapRouteSummary, formatRouteEta } from '../../lib/mapRouting';
import { Navigation, Loader2 } from 'lucide-react';

interface MapRouteBannerProps {
  route: MapRouteSummary | null;
  loading?: boolean;
  label?: string;
}

/** Compact Uber-style route pill over the map */
export function MapRouteBanner({ route, loading, label = 'To selected offer' }: MapRouteBannerProps) {
  if (!loading && !route) return null;

  return (
    <div className="map-route-banner">
      <Navigation className="w-4 h-4 text-brand-primary shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-brand-text-muted font-medium">{label}</p>
        {loading ? (
          <p className="text-sm font-semibold flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Routing…
          </p>
        ) : route ? (
          <p className="text-sm font-semibold">
            {route.distanceMiles} mi · {formatRouteEta(route.durationMinutes)} drive
          </p>
        ) : null}
      </div>
    </div>
  );
}
