import React, { useMemo, useState } from 'react';
import { SecurityRequest } from '../../types';
import { ShiftMap } from '../guard/ShiftMap';
import { MapRouteBanner } from '../map/MapRouteBanner';
import { MapSelectionExperience } from '../map/MapSelectionExperience';
import { MapRouteSummary } from '../../lib/mapRouting';

interface StaffOpsMapScreenProps {
  requests: SecurityRequest[];
}

/** Platform ops map — route to live offers with listing detail cards */
export function StaffOpsMapScreen({ requests }: StaffOpsMapScreenProps) {
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
    <div className="h-full min-h-0 relative overflow-hidden staff-map-layout">
      {selectedJob && (
        <MapRouteBanner route={route} loading={routeLoading} label="To selected job" />
      )}
      <ShiftMap
        jobs={mapJobs}
        selectedJobId={selectedJobId}
        onSelectJob={setSelectedJobId}
        pinMode="staff"
        onRouteChange={setRoute}
        onRouteLoadingChange={setRouteLoading}
      />
      <MapSelectionExperience
        job={selectedJob}
        role="staff"
        route={route}
        loadingRoute={routeLoading}
        onClose={() => setSelectedJobId(null)}
      />
    </div>
  );
}
