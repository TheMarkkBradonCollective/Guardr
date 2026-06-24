import React, { useEffect, useMemo, useState } from 'react';
import { SecurityGuard, SecurityRequest, SessionUser } from '../../types';
import { ShiftMap } from '../guard/ShiftMap';
import { MapRouteBanner } from '../map/MapRouteBanner';
import { MapSelectionExperience } from '../map/MapSelectionExperience';
import { MapRouteSummary } from '../../lib/mapRouting';
import { ClientActiveShift } from './ClientActiveShift';
import {
  clientBrowseMapJobs,
  clientMapPinKind,
  clientJobMatchesMapStatusFilter,
  CLIENT_MAP_STATUS_FILTERS,
  type ClientMapStatusFilter,
} from '../../lib/mapJobVisibility';
import { MapPinFilterStepper } from '../map/MapPinFilterStepper';
import { getClientLiveJobs, getPrimaryClientLiveJob, guardForRequest, isClientLiveJob } from '../../lib/clientShift';
import { ClientJobActionsPanel } from './ClientJobActionsPanel';
import { ClientMapPostMenu } from './ClientMapBrowseDock';
import type { ClientJobActionsBindings } from './clientJobActionsTypes';

interface ClientMapScreenProps extends ClientJobActionsBindings {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  currentUser?: SessionUser;
  onOpenJobChat?: (requestId: string) => void;
  onPostJob?: () => void;
  onRequestGuard?: () => void;
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
  initialLiveJobId = null,
  onLiveJobIdChange,
  ...jobActions
}: ClientMapScreenProps) {
  const clockedInJobs = useMemo(() => getClientLiveJobs(requests), [requests]);
  const primaryLiveJob = useMemo(() => getPrimaryClientLiveJob(requests), [requests]);
  const [selectedLiveJobId, setSelectedLiveJobId] = useState<string | null>(
    initialLiveJobId ?? primaryLiveJob?.id ?? null
  );
  const [selectedBrowseJobId, setSelectedBrowseJobId] = useState<string | null>(null);
  const [mapStatusFilter, setMapStatusFilter] = useState<ClientMapStatusFilter>('all');
  const [route, setRoute] = useState<MapRouteSummary | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

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
    return clientBrowseMapJobs(currentUser.id, currentUser.clientName, requests);
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
    <div className="h-full min-h-0 relative overflow-hidden guard-map-layout client-map-layout">
      {selectedBrowseJob && !showShiftOverlay && (
        <MapRouteBanner route={route} loading={routeLoading} label="Your job" />
      )}

      {!showShiftOverlay && (
        <MapPinFilterStepper
          filters={CLIENT_MAP_STATUS_FILTERS}
          value={mapStatusFilter}
          onChange={setMapStatusFilter}
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
        drawRoute={!showShiftOverlay}
        onRouteChange={setRoute}
        onRouteLoadingChange={setRouteLoading}
        getPinKind={(job) => clientMapPinKind(job as SecurityRequest)}
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
          onClose={() => setSelectedBrowseJobId(null)}
          bottomOffsetClass="map-browse-offset"
          clientActions={
            selectedBrowseJob && currentUser ? (
              <ClientJobActionsPanel
                request={selectedBrowseJob}
                context="map"
                {...mapActionProps}
              />
            ) : null
          }
        />
      )}

      {!showShiftOverlay && !selectedBrowseJobId && onPostJob && onRequestGuard && (
        <div className="map-post-fab-layer map-post-fab-layer--right map-browse-offset">
          <ClientMapPostMenu onPostJob={onPostJob} onRequestGuard={onRequestGuard} />
        </div>
      )}
    </div>
  );
}
