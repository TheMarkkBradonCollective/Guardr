import React, { useMemo, useState } from 'react';
import { PlatformRole, SecurityGuard, SecurityRequest } from '../../types';
import { ShiftMap } from '../guard/ShiftMap';
import { MapRouteBanner } from '../map/MapRouteBanner';
import { MapSelectionExperience } from '../map/MapSelectionExperience';
import { MapRouteSummary } from '../../lib/mapRouting';
import { staffVisibleMapJobs, staffMapPinKind } from '../../lib/mapJobVisibility';
import { StaffJobDetailPanel } from './StaffJobDetailPanel';
import type { StaffSelfAuditPhotoPayload } from './StaffSelfAuditPhotoUpload';

interface StaffOpsMapScreenProps {
  requests: SecurityRequest[];
  guards: SecurityGuard[];
  canManageJobs?: boolean;
  canUploadSelfAuditPhotos?: boolean;
  canUploadSpotCheck?: boolean;
  canEditJobListing?: boolean;
  staffRole?: PlatformRole;
  onApproveRequest: (id: string) => void;
  onDenyRequest: (id: string) => void;
  onAssignGuard?: (requestId: string, guardId: string) => Promise<void>;
  onUploadSelfAuditPhotos?: (requestId: string, photos: StaffSelfAuditPhotoPayload) => void | Promise<void>;
  onUploadSpotCheck?: (requestId: string, imageUrl: string) => void | Promise<void>;
  onEditJobListing?: (requestId: string, updates: Partial<SecurityRequest>) => void | Promise<void>;
  onApproveGuardApplication?: (requestId: string, guardId: string) => void | Promise<void>;
  onDenyGuardApplication?: (requestId: string, guardId: string) => void | Promise<void>;
}

/** Platform ops map — peek summary on pin tap, full job ops when expanded. */
export function StaffOpsMapScreen({
  requests,
  guards,
  canManageJobs = false,
  canUploadSelfAuditPhotos = false,
  canUploadSpotCheck = false,
  canEditJobListing = false,
  staffRole,
  onApproveRequest,
  onDenyRequest,
  onAssignGuard,
  onUploadSelfAuditPhotos,
  onUploadSpotCheck,
  onEditJobListing,
  onApproveGuardApplication,
  onDenyGuardApplication,
}: StaffOpsMapScreenProps) {
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
        getPinKind={(job) => staffMapPinKind(job as SecurityRequest)}
      />
      <MapSelectionExperience
        job={selectedJob}
        role="staff"
        route={route}
        loadingRoute={routeLoading}
        guards={guards}
        onClose={() => setSelectedJobId(null)}
        bottomOffsetClass="map-browse-offset"
        staffActions={
          selectedJob ? (
            <StaffJobDetailPanel
              req={selectedJob}
              guards={guards}
              canManageJobs={canManageJobs}
              canUploadSelfAuditPhotos={canUploadSelfAuditPhotos}
              canUploadSpotCheck={canUploadSpotCheck}
              canEditJobListing={canEditJobListing}
              staffRole={staffRole}
              onApproveRequest={onApproveRequest}
              onDenyRequest={onDenyRequest}
              onAssignGuard={onAssignGuard}
              onUploadSelfAuditPhotos={onUploadSelfAuditPhotos}
              onUploadSpotCheck={onUploadSpotCheck}
              onEditJobListing={onEditJobListing}
              onApproveGuardApplication={onApproveGuardApplication}
              onDenyGuardApplication={onDenyGuardApplication}
              showStatusHeader={false}
            />
          ) : null
        }
      />
    </div>
  );
}
