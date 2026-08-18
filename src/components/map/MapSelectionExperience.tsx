import React, { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { SecurityGuard, SecurityRequest } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { MapRouteSummary } from '../../lib/mapRouting';
import { useMapBottomOverlayInset } from '../../lib/mapViewportInsets';
import { prefersMobileGestureUi, useDevice } from '../../lib/platform';
import { useSurfaceKind } from '../../surfaces';
import { GuardrButton } from '../baseui/GuardrButton';
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
  const { viewSurface } = useDevice();
  const surface = useSurfaceKind();
  // Side inspector on website desktop and on the tablet app. Mobile keeps the
  // slide-up offer card so one-handed map use is unchanged.
  const websiteDesktop = !prefersMobileGestureUi(viewSurface);
  const sideInspector = websiteDesktop || surface === 'tablet';
  const [expanded, setExpanded] = useState(sideInspector);
  const cardInsetRef = useMapBottomOverlayInset(!sideInspector);
  const selected = useMemo(() => job, [job?.id]);
  const guardBody = guardFullBody ?? detailActions;

  React.useEffect(() => {
    setExpanded(sideInspector);
  }, [selected?.id, sideInspector]);

  if (!selected) return null;

  const payLine =
    role === 'guard' ? (
      <JobBillingSummaryFromGuardJob job={selected as GuardJobView} />
    ) : (
      <JobBillingSummaryFromRequest
        req={selected as SecurityRequest}
        variant={role === 'staff' ? 'staff' : 'client'}
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

  if (sideInspector) {
    return (
      <aside
        className={`desktop-map-inspector dsk-map-inspector map-selection-layer map-selection-layer--desktop${surface === 'tablet' ? ' sft-map-inspector' : ''}`}
        aria-label="Job details"
      >
        <div className="desktop-map-inspector-header">
          <p className="desktop-map-inspector-header-label">
            {'title' in selected ? selected.title : 'Job details'}
          </p>
          <button type="button" className="uber-map-inspector-close" onClick={onClose} aria-label="Close">
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
            <GuardrButton kind="primary" size="compact" onClick={onPrimaryAction}>
              {primaryLabel}
            </GuardrButton>
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
