import React, { useEffect, useMemo, useState } from 'react';
import { SecurityGuard, SecurityRequest, SessionUser } from '../../types';
import { ShiftMap } from '../guard/ShiftMap';
import { MapRouteBanner } from '../map/MapRouteBanner';
import { MapSelectionExperience } from '../map/MapSelectionExperience';
import { MapRouteSummary } from '../../lib/mapRouting';
import { ClientActiveShift } from './ClientActiveShift';
import { getClientLiveJobs, getPrimaryClientLiveJob, guardForRequest } from '../../lib/clientShift';

interface ClientMapScreenProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  currentUser?: SessionUser;
  onOpenCoverage?: () => void;
  onOpenJobChat?: (requestId: string) => void;
  initialLiveJobId?: string | null;
  onLiveJobIdChange?: (requestId: string | null) => void;
}

export function ClientMapScreen({
  requests,
  guards,
  currentUser,
  onOpenCoverage,
  onOpenJobChat,
  initialLiveJobId = null,
  onLiveJobIdChange,
}: ClientMapScreenProps) {
  const liveJobs = useMemo(() => getClientLiveJobs(requests), [requests]);
  const primaryLiveJob = useMemo(() => getPrimaryClientLiveJob(requests), [requests]);
  const [selectedLiveJobId, setSelectedLiveJobId] = useState<string | null>(
    initialLiveJobId ?? primaryLiveJob?.id ?? null
  );
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [route, setRoute] = useState<MapRouteSummary | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const activeLiveJob = useMemo(() => {
    if (selectedLiveJobId) {
      return liveJobs.find((j) => j.id === selectedLiveJobId) ?? primaryLiveJob;
    }
    return primaryLiveJob;
  }, [liveJobs, selectedLiveJobId, primaryLiveJob]);

  const activeGuard = activeLiveJob ? guardForRequest(guards, activeLiveJob) : null;
  const showShiftOverlay = !!activeLiveJob && !!activeGuard;

  const mapJobs = useMemo(() => {
    const posted = requests.filter((r) =>
      ['pending-review', 'open', 'accepted', 'in-progress'].includes(r.status)
    );
    return posted;
  }, [requests]);

  const selectedOffer = useMemo(
    () => mapJobs.find((j) => j.id === selectedOfferId) ?? null,
    [mapJobs, selectedOfferId]
  );

  useEffect(() => {
    if (initialLiveJobId) setSelectedLiveJobId(initialLiveJobId);
    else if (!selectedLiveJobId && primaryLiveJob) setSelectedLiveJobId(primaryLiveJob.id);
  }, [initialLiveJobId, primaryLiveJob?.id]);

  useEffect(() => {
    if (showShiftOverlay) setSelectedOfferId(null);
  }, [showShiftOverlay, activeLiveJob?.id]);

  const switchLiveJob = (requestId: string) => {
    setSelectedLiveJobId(requestId);
    onLiveJobIdChange?.(requestId);
  };

  return (
    <div className="h-full min-h-0 relative overflow-hidden guard-map-layout client-map-layout">
      {selectedOffer && !showShiftOverlay && (
        <MapRouteBanner route={route} loading={routeLoading} label="Your posted offer" />
      )}

      <ShiftMap
        jobs={mapJobs}
        selectedJobId={showShiftOverlay ? activeLiveJob?.id ?? null : selectedOfferId}
        onSelectJob={(id) => {
          if (showShiftOverlay && id && liveJobs.some((j) => j.id === id)) {
            switchLiveJob(id);
            return;
          }
          setSelectedOfferId(id);
        }}
        pinMode="client"
        drawRoute={!showShiftOverlay}
        onRouteChange={setRoute}
        onRouteLoadingChange={setRouteLoading}
      />

      {showShiftOverlay && activeLiveJob && activeGuard && (
        <ClientActiveShift
          request={activeLiveJob}
          guard={activeGuard}
          allLiveRequests={liveJobs}
          onOpenJobChat={
            onOpenJobChat && currentUser ? () => onOpenJobChat(activeLiveJob.id) : undefined
          }
          onOpenCoverage={onOpenCoverage}
          onSwitchJob={liveJobs.length > 1 ? switchLiveJob : undefined}
        />
      )}

      {!showShiftOverlay && (
        <MapSelectionExperience
          job={selectedOffer}
          role="client"
          route={route}
          loadingRoute={routeLoading}
          onClose={() => setSelectedOfferId(null)}
          bottomOffsetClass="client-map-offer-offset"
        />
      )}
    </div>
  );
}
