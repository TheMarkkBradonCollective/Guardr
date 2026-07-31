import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PlatformRole, SecurityGuard, SecurityRequest } from '../../types';
import { ShiftMap, type MapZoomControls } from '../guard/ShiftMap';
import { MapRouteBanner } from '../map/MapRouteBanner';
import { MapSelectionExperience } from '../map/MapSelectionExperience';
import { MapPinFilterStepper } from '../map/MapPinFilterStepper';
import { MapBrowseDock } from '../map/MapBrowseDock';
import { MapRouteSummary } from '../../lib/mapRouting';
import { staffMapBrowseItems } from '../../lib/mapBrowseItems';
import { STAFF_MAP_BROWSE_EMPTY_MESSAGE } from '../../lib/mapEmptyMessages';
import {
  STAFF_MAP_STATUS_FILTERS,
  staffJobMatchesMapStatusFilter,
  staffMapPinKind,
  staffMapShouldRouteToJob,
  staffVisibleMapJobs,
  type StaffMapStatusFilter,
} from '../../lib/mapJobVisibility';
import { MapViewportInsetsProvider } from '../../lib/mapViewportInsets';
import { StaffJobDetailPanel } from './StaffJobDetailPanel';

interface StaffOpsMapScreenProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  canManageJobs?: boolean;
  canEditJobListing?: boolean;
  staffRole?: PlatformRole;
  onApproveRequest: (id: string) => void;
  onDenyRequest: (id: string) => void;
  onEditJobListing?: (requestId: string, updates: Partial<SecurityRequest>) => void | Promise<void>;
  onApproveGuardApplication?: (requestId: string, guardId: string) => void | Promise<void>;
  onDenyGuardApplication?: (requestId: string, guardId: string) => void | Promise<void>;
}

/** Platform ops map — Uber-style filters, browse dock, and job detail sheet. */
export function StaffOpsMapScreen({
  requests,
  guards,
  canEditJobListing = false,
  staffRole,
  onApproveRequest,
  onDenyRequest,
  onEditJobListing,
  onApproveGuardApplication,
  onDenyGuardApplication,
}: StaffOpsMapScreenProps) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [mapStatusFilter, setMapStatusFilter] = useState<StaffMapStatusFilter>('all');
  const [route, setRoute] = useState<MapRouteSummary | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const mapZoomRef = useRef<MapZoomControls | null>(null);

  const allMapJobs = useMemo(() => staffVisibleMapJobs(requests), [requests]);

  const filteredMapJobs = useMemo(
    () => allMapJobs.filter((job) => staffJobMatchesMapStatusFilter(job, mapStatusFilter)),
    [allMapJobs, mapStatusFilter],
  );

  const selectedJob = useMemo(
    () => filteredMapJobs.find((j) => j.id === selectedJobId) ?? null,
    [filteredMapJobs, selectedJobId],
  );

  const selectedJobShouldRoute = useMemo(
    () => (selectedJob ? staffMapShouldRouteToJob(selectedJob) : false),
    [selectedJob],
  );

  const browseItems = useMemo(() => staffMapBrowseItems(filteredMapJobs), [filteredMapJobs]);

  const liveGuardPins = useMemo(
    () =>
      requests
        .filter(
          (job) =>
            !!job.guardLiveLocation &&
            (job.status === 'in-progress' ||
              (job.status === 'accepted' && (!!job.enRouteAt || !!job.arrivedAt)))
        )
        .map((job) => ({
          requestId: job.id,
          lat: job.guardLiveLocation!.lat,
          lng: job.guardLiveLocation!.lng,
          label: guards.find((g) => g.id === job.assignedGuardId)?.name,
        })),
    [requests, guards],
  );

  useEffect(() => {
    if (selectedJobId && !filteredMapJobs.some((job) => job.id === selectedJobId)) {
      setSelectedJobId(null);
    }
  }, [filteredMapJobs, selectedJobId]);

  return (
    <MapViewportInsetsProvider>
      <div className="h-full min-h-0 relative overflow-hidden staff-map-layout staff-map-layout--uber">
        <MapPinFilterStepper<StaffMapStatusFilter>
          filters={STAFF_MAP_STATUS_FILTERS}
          value={mapStatusFilter}
          onChange={setMapStatusFilter}
          onZoomIn={() => mapZoomRef.current?.zoomIn()}
          onZoomOut={() => mapZoomRef.current?.zoomOut()}
          routeSlot={
            selectedJob && selectedJobShouldRoute ? (
              <MapRouteBanner route={route} loading={routeLoading} label="Route to job" />
            ) : null
          }
        />

        <ShiftMap
          jobs={filteredMapJobs}
          selectedJobId={selectedJobId}
          onSelectJob={setSelectedJobId}
          pinMode="staff"
          drawRoute={selectedJobShouldRoute}
          onRouteChange={setRoute}
          onRouteLoadingChange={setRouteLoading}
          getPinKind={(job) => staffMapPinKind(job as SecurityRequest)}
          liveGuardPins={liveGuardPins}
          zoomRef={mapZoomRef}
          routeFitResetKey={selectedJobId ?? ''}
        />

        {!selectedJobId ? (
          <MapBrowseDock
            items={browseItems}
            selectedId={selectedJobId}
            onSelect={setSelectedJobId}
            emptyMessage={STAFF_MAP_BROWSE_EMPTY_MESSAGE}
            bottomOffsetClass=""
          />
        ) : null}

        <MapSelectionExperience
          job={selectedJob}
          role="staff"
          route={route}
          loadingRoute={routeLoading}
          guards={guards}
          onClose={() => setSelectedJobId(null)}
          bottomOffsetClass=""
          staffActions={
            selectedJob ? (
              <StaffJobDetailPanel
                req={selectedJob}
                guards={guards}
                canEditJobListing={canEditJobListing}
                staffRole={staffRole}
                onApproveRequest={onApproveRequest}
                onDenyRequest={onDenyRequest}
                onEditJobListing={onEditJobListing}
                onApproveGuardApplication={onApproveGuardApplication}
                onDenyGuardApplication={onDenyGuardApplication}
                showStatusHeader={false}
              />
            ) : null
          }
        />
      </div>
    </MapViewportInsetsProvider>
  );
}
