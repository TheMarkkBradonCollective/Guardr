import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SecurityGuard, SecurityRequest, SessionUser } from '../../types';
import type { PlatformSettings } from '../../lib/platformSettings';
import { ShiftMap, type MapZoomControls } from '../guard/ShiftMap';
import { MapRouteBanner } from '../map/MapRouteBanner';
import { MapSelectionExperience } from '../map/MapSelectionExperience';
import { MapRouteSummary } from '../../lib/mapRouting';
import { ClientActiveShift } from './ClientActiveShift';
import {
  clientBrowseMapJobs,
  clientMapPinKind,
  clientJobMatchesMapStatusFilter,
  clientMapShouldRouteToJob,
  CLIENT_MAP_STATUS_FILTERS,
  type ClientMapStatusFilter,
} from '../../lib/mapJobVisibility';
import { MapPinFilterStepper } from '../map/MapPinFilterStepper';
import { getClientLiveJobs, getPrimaryClientLiveJob, guardForRequest, isClientLiveJob } from '../../lib/clientShift';
import { ClientJobActionsPanel } from './ClientJobActionsPanel';
import { ClientMapPostMenu } from './ClientMapBrowseDock';
import type { ClientJobActionsBindings } from './clientJobActionsTypes';
import {
  canClientReschedulePaidSchedule,
  isJobScheduleLocked,
} from '../../lib/jobEditRules';
import { EditRequestSheet } from '../jobs/EditRequestSheet';
import { MapViewportInsetsProvider } from '../../lib/mapViewportInsets';

interface ClientMapScreenProps extends ClientJobActionsBindings {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  currentUser?: SessionUser;
  onOpenJobChat?: (requestId: string) => void;
  onPostJob?: () => void;
  onRequestGuard?: () => void;
  onEditRequest?: (requestId: string, updates: Partial<SecurityRequest>) => void | Promise<void>;
  initialLiveJobId?: string | null;
  onLiveJobIdChange?: (requestId: string | null) => void;
}

export function ClientMapScreen({
  requests,
  guards,
  currentUser,
  onOpenJobChat,
  onPostJob,
  onRequestGuard,
  onEditRequest,
  initialLiveJobId = null,
  onLiveJobIdChange,
  crewSettings,
  teamLeadSettings,
  ...jobActions
}: ClientMapScreenProps) {
  const billingSettings = crewSettings ?? teamLeadSettings;
  const clockedInJobs = useMemo(() => getClientLiveJobs(requests), [requests]);
  const primaryLiveJob = useMemo(() => getPrimaryClientLiveJob(requests), [requests]);
  const [selectedLiveJobId, setSelectedLiveJobId] = useState<string | null>(
    initialLiveJobId ?? primaryLiveJob?.id ?? null
  );
  const [selectedBrowseJobId, setSelectedBrowseJobId] = useState<string | null>(null);
  const [mapStatusFilter, setMapStatusFilter] = useState<ClientMapStatusFilter>('all');
  const mapZoomRef = useRef<MapZoomControls | null>(null);
  const [route, setRoute] = useState<MapRouteSummary | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const editingRequest = editingId ? requests.find((r) => r.id === editingId) ?? null : null;

  const activeLiveJob = useMemo(() => {
    if (selectedLiveJobId) {
      return clockedInJobs.find((j) => j.id === selectedLiveJobId) ?? primaryLiveJob;
    }
    return primaryLiveJob;
  }, [clockedInJobs, selectedLiveJobId, primaryLiveJob]);

  const activeGuard = activeLiveJob ? guardForRequest(guards, activeLiveJob) : null;
  const showShiftOverlay = !!activeLiveJob && !!activeGuard && isClientLiveJob(activeLiveJob);

  const browseJobs = useMemo(() => {
    if (!currentUser) return [];
    return clientBrowseMapJobs(currentUser.id, currentUser.clientName, requests, currentUser.name);
  }, [requests, currentUser]);

  const filteredBrowseJobs = useMemo(
    () => browseJobs.filter((job) => clientJobMatchesMapStatusFilter(job, mapStatusFilter)),
    [browseJobs, mapStatusFilter]
  );

  const mapJobs = showShiftOverlay ? clockedInJobs : filteredBrowseJobs;

  const selectedBrowseJob = useMemo(
    () => filteredBrowseJobs.find((j) => j.id === selectedBrowseJobId) ?? null,
    [filteredBrowseJobs, selectedBrowseJobId]
  );

  const selectedBrowseJobShouldRoute = useMemo(
    () => (selectedBrowseJob ? clientMapShouldRouteToJob(selectedBrowseJob) : false),
    [selectedBrowseJob]
  );

  useEffect(() => {
    if (selectedBrowseJobId && !filteredBrowseJobs.some((j) => j.id === selectedBrowseJobId)) {
      setSelectedBrowseJobId(null);
    }
  }, [filteredBrowseJobs, selectedBrowseJobId]);

  useEffect(() => {
    if (initialLiveJobId) setSelectedLiveJobId(initialLiveJobId);
    else if (!selectedLiveJobId && primaryLiveJob) setSelectedLiveJobId(primaryLiveJob.id);
  }, [initialLiveJobId, primaryLiveJob?.id]);

  useEffect(() => {
    if (showShiftOverlay) setSelectedBrowseJobId(null);
  }, [showShiftOverlay, activeLiveJob?.id]);

  const switchLiveJob = (requestId: string) => {
    setSelectedLiveJobId(requestId);
    onLiveJobIdChange?.(requestId);
  };

  const mapActionProps = {
    ...jobActions,
    guards,
    currentUser,
    onOpenJobChat,
  };

  return (
    <MapViewportInsetsProvider>
    <div className="h-full min-h-0 relative overflow-hidden guard-map-layout client-map-layout">
      {!showShiftOverlay && (
        <MapPinFilterStepper<ClientMapStatusFilter>
          filters={CLIENT_MAP_STATUS_FILTERS}
          value={mapStatusFilter}
          onChange={(value) => setMapStatusFilter(value as ClientMapStatusFilter)}
          onZoomIn={() => mapZoomRef.current?.zoomIn()}
          onZoomOut={() => mapZoomRef.current?.zoomOut()}
          routeSlot={
            selectedBrowseJobShouldRoute ? (
              <MapRouteBanner route={route} loading={routeLoading} label="Route to job" />
            ) : null
          }
        />
      )}

      <ShiftMap
        jobs={mapJobs}
        selectedJobId={showShiftOverlay ? activeLiveJob?.id ?? null : selectedBrowseJobId}
        onSelectJob={(id) => {
          if (showShiftOverlay && id && clockedInJobs.some((j) => j.id === id)) {
            switchLiveJob(id);
            return;
          }
          setSelectedBrowseJobId(id);
        }}
        pinMode="client"
        drawRoute={!showShiftOverlay && selectedBrowseJobShouldRoute}
        onRouteChange={setRoute}
        onRouteLoadingChange={setRouteLoading}
        getPinKind={(job) => clientMapPinKind(job as SecurityRequest)}
        zoomRef={mapZoomRef}
        routeFitResetKey={selectedBrowseJobId ?? ''}
      />

      {showShiftOverlay && activeLiveJob && activeGuard && (
        <ClientActiveShift
          request={activeLiveJob}
          guard={activeGuard}
          guards={guards}
          allLiveRequests={clockedInJobs}
          onOpenJobChat={
            onOpenJobChat && currentUser ? () => onOpenJobChat(activeLiveJob.id) : undefined
          }
          onSwitchJob={clockedInJobs.length > 1 ? switchLiveJob : undefined}
          jobActions={mapActionProps}
        />
      )}

      {!showShiftOverlay && (
        <MapSelectionExperience
          job={selectedBrowseJob}
          role="client"
          route={route}
          loadingRoute={routeLoading}
          crewSettings={billingSettings}
          onClose={() => setSelectedBrowseJobId(null)}
          bottomOffsetClass="map-browse-offset"
          clientActions={
            selectedBrowseJob && currentUser ? (
              <ClientJobActionsPanel
                request={selectedBrowseJob}
                context="jobs"
                crewSettings={billingSettings}
                {...mapActionProps}
                onRequestEdit={setEditingId}
              />
            ) : null
          }
        />
      )}

      {editingRequest && (
        <EditRequestSheet
          open
          request={editingRequest}
          scheduleLocked={isJobScheduleLocked(editingRequest)}
          paidReschedule={canClientReschedulePaidSchedule(editingRequest)}
          onSave={async (requestId, updates) => {
            await onEditRequest?.(requestId, updates);
            setEditingId(null);
          }}
          onClose={() => setEditingId(null)}
        />
      )}

      {!showShiftOverlay && !selectedBrowseJobId && onPostJob && onRequestGuard && (
        <div className="map-post-fab-layer map-post-fab-layer--right map-browse-offset">
          <ClientMapPostMenu onPostJob={onPostJob} onRequestGuard={onRequestGuard} />
        </div>
      )}
    </div>
    </MapViewportInsetsProvider>
  );
}
