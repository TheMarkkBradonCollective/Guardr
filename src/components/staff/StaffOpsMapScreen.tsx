import React, { useMemo, useState } from 'react';
import { SecurityRequest } from '../../types';
import { ShiftMap } from '../guard/ShiftMap';
import { MapRouteBanner } from '../map/MapRouteBanner';
import { MapSelectionExperience } from '../map/MapSelectionExperience';
import { MapRouteSummary } from '../../lib/mapRouting';
import { staffVisibleMapJobs } from '../../lib/mapJobVisibility';
import { MapBrowseDock } from '../map/MapBrowseDock';
import { staffMapBrowseItems } from '../../lib/mapBrowseItems';

interface StaffOpsMapScreenProps {
  requests: SecurityRequest[];
}

/** Platform ops map — all jobs with Sacramento Buy Nothing-style browse dock. */
export function StaffOpsMapScreen({ requests }: StaffOpsMapScreenProps) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [route, setRoute] = useState<MapRouteSummary | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const mapJobs = useMemo(() => staffVisibleMapJobs(requests), [requests]);

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
        bottomOffsetClass="map-browse-offset"
      />
      <MapBrowseDock
        items={staffMapBrowseItems(mapJobs)}
        selectedId={selectedJobId}
        onSelect={setSelectedJobId}
        bottomOffsetClass="map-browse-offset"
        emptyMessage="All platform jobs appear on the map."
      />
    </div>
  );
}
