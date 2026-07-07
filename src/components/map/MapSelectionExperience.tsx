import React, { useMemo, useState } from 'react';
import { SecurityGuard, SecurityRequest } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { MapRouteSummary } from '../../lib/mapRouting';
import { useMapBottomOverlayInset } from '../../lib/mapViewportInsets';
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
  /** Client billing settings for full detail */
  crewSettings?: import('../../lib/platformSettings').PlatformSettings;
  /** Client approvals / payments in expanded card */
  clientActions?: React.ReactNode;
  /** Guard full detail + controls in expanded card */
  guardFullBody?: React.ReactNode;
  /** @deprecated Use guardFullBody */
  detailActions?: React.ReactNode;
  /** Staff ops detail + controls in expanded card */
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
  const [expanded, setExpanded] = useState(false);
  const cardInsetRef = useMapBottomOverlayInset(true);
  const selected = useMemo(() => job, [job?.id]);
  const guardBody = guardFullBody ?? detailActions;

  React.useEffect(() => {
    setExpanded(false);
  }, [selected?.id]);

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
        {expanded && (
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
        )}
      </MapOfferCard>
    </div>
  );
}
