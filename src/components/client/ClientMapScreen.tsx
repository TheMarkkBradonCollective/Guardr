import React, { useMemo, useState } from 'react';
import { SecurityRequest } from '../../types';
import { ShiftMap } from '../guard/ShiftMap';
import { MapRouteBanner } from '../map/MapRouteBanner';
import { MapSelectionExperience } from '../map/MapSelectionExperience';
import { MapRouteSummary } from '../../lib/mapRouting';

interface ClientMapScreenProps {
  requests: SecurityRequest[];
}

export function ClientMapScreen({ requests }: ClientMapScreenProps) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [route, setRoute] = useState<MapRouteSummary | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const mapJobs = useMemo(
    () =>
      requests.filter((r) =>
        ['pending-review', 'open', 'accepted', 'in-progress'].includes(r.status)
      ),
    [requests]
  );

  const selectedJob = useMemo(
    () => mapJobs.find((j) => j.id === selectedJobId) ?? null,
    [mapJobs, selectedJobId]
  );

  return (
    <div className="h-full min-h-0 relative overflow-hidden guard-map-layout client-map-layout">
      {selectedJob && (
        <MapRouteBanner route={route} loading={routeLoading} label="To your posted offer" />
      )}
      <ShiftMap
        jobs={mapJobs}
        selectedJobId={selectedJobId}
        onSelectJob={setSelectedJobId}
        pinMode="client"
        onRouteChange={setRoute}
        onRouteLoadingChange={setRouteLoading}
      />
      <MapSelectionExperience
        job={selectedJob}
        role="client"
        route={route}
        loadingRoute={routeLoading}
        onClose={() => setSelectedJobId(null)}
        bottomOffsetClass="client-map-offer-offset"
      />
    </div>
  );
}
