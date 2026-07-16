import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { SecurityGuard, SecurityRequest } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { MapRouteSummary } from '../../lib/mapRouting';
import { useMapBottomOverlayInset } from '../../lib/mapViewportInsets';
import { useDevice } from '../../lib/platform';
import { JobListingProfile } from '../jobs/JobListingProfile';
import { JobBillingSummaryFromRequest } from '../jobs/JobBillingSummary';
import { JobBillingSummaryFromGuardJob } from '../jobs/JobBillingSummary';
import { MapJobPeekSummary } from './MapJobPeekSummary';
import { MapOfferCard, MapViewerRole } from './MapOfferCard';

type MapJob = GuardJobView | SecurityRequest;

interface MapSelectionExperienceProps {
  job: MapJob | null;
  role: MapViewerRole;
  route: MapRouteSummary | null;
  loadingRoute?: boolean;
  onClose: () => void;
  onPrimaryAction?: () => void;
  primaryLabel?: string;
  bottomOffsetClass?: string;
  guardId?: string;
  guards?: SecurityGuard[];
  crewSettings?: import('../../lib/platformSettings').PlatformSettings;
  clientActions?: React.ReactNode;
  guardFullBody?: React.ReactNode;
  detailActions?: React.ReactNode;
  staffActions?: React.ReactNode;
}

export function MapSelectionExperience({
  job,
  role,
  route,
  loadingRoute,
  onClose,
  onPrimaryAction,
  primaryLabel,
  bottomOffsetClass = '',
  guardId,
  guards = [],
  crewSettings,
  clientActions,
  guardFullBody,
  detailActions,
  staffActions,
}: MapSelectionExperienceProps) {
  const { formFactor } = useDevice();
  const isDesktop = formFactor === 'desktop';
  const [expanded, setExpanded] = useState(isDesktop);
  const cardInsetRef = useMapBottomOverlayInset(!isDesktop);
  const selected = useMemo(() => job, [job?.id]);
  const guardBody = guardFullBody ?? detailActions;

  React.useEffect(() => {
    setExpanded(isDesktop);
  }, [selected?.id, isDesktop]);

  if (!selected) return null;

  const payLine =
    role === 'guard' ? (
      <JobBillingSummaryFromGuardJob job={selected as GuardJobView} />
    ) : (
      <JobBillingSummaryFromRequest
        req={selected as SecurityRequest}
        variant={role === 'staff' ? 'staff' : 'client'}
        crewSettings={role === 'client' ? crewSettings : undefined}
        hideCrewUpcostNotice={role === 'client'}
      />
    );

  const operationalDetails = 'operationalDetails' in selected ? selected.operationalDetails : undefined;
  const operationalBriefingLocked =
    role === 'guard' && 'operationalBriefingLocked' in selected
      ? !!selected.operationalBriefingLocked
      : false;
  const jobStatus = 'status' in selected ? selected.status : undefined;

  const detailBody = (
    <div className="space-y-4">
      {role === 'client' && (
        <JobListingProfile
          job={selected}
          showClientHeader={false}
          showBadges={false}
          distanceMiles={route?.distanceMiles}
          payLine={payLine}
          operationalDetails={operationalDetails}
          operationalBriefingLocked={operationalBriefingLocked}
          jobStatus={jobStatus}
        />
      )}
      {role === 'guard' && guardBody}
      {role === 'staff' && staffActions}
      {role === 'client' && clientActions}
    </div>
  );

  if (isDesktop) {
    return (
      <aside className="desktop-map-inspector dsk-map-inspector map-selection-layer map-selection-layer--desktop" aria-label="Job details">
        <div className="desktop-map-inspector-header">
          <p className="desktop-map-inspector-header-label">
            {'title' in selected ? selected.title : 'Job details'}
          </p>
          <button type="button" className="adm-header-icon-btn" onClick={onClose} aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="desktop-map-inspector-body guard-scroll-panel">
          <MapJobPeekSummary
            role={role}
            job={selected}
            route={route}
            loadingRoute={loadingRoute}
            guardId={guardId}
            guards={guards}
          />
          {onPrimaryAction && primaryLabel ? (
            <button type="button" className="adm-btn adm-btn--sand adm-btn--sm adm-mt-sm" onClick={onPrimaryAction}>
              {primaryLabel}
            </button>
          ) : null}
          {detailBody}
        </div>
      </aside>
    );
  }

  return (
    <div className={`map-selection-layer ${bottomOffsetClass}`}>
      <MapOfferCard
        ref={cardInsetRef}
        summary={
          <MapJobPeekSummary
            role={role}
            job={selected}
            route={route}
            loadingRoute={loadingRoute}
            guardId={guardId}
            guards={guards}
          />
        }
        expanded={expanded}
        onClose={() => {
          setExpanded(false);
          onClose();
        }}
        onExpand={() => setExpanded(true)}
        onPrimaryAction={!expanded ? onPrimaryAction : undefined}
        primaryLabel={!expanded ? primaryLabel : undefined}
      >
        {expanded && detailBody}
      </MapOfferCard>
    </div>
  );
}
