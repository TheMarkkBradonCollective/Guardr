import React, { useMemo, useState } from 'react';
import { SecurityRequest } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { MapRouteSummary } from '../../lib/mapRouting';
import { JobListingProfile } from '../jobs/JobListingProfile';
import { JobBillingSummaryFromRequest } from '../jobs/JobBillingSummary';
import { JobBillingSummaryFromGuardJob } from '../jobs/JobBillingSummary';
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
  /** Bottom offset when bottom nav is visible */
  bottomOffsetClass?: string;
  /** Client approvals / payments rendered inside the expanded card */
  clientActions?: React.ReactNode;
  /** Role-specific actions in the expanded card (guard crew controls, etc.) */
  detailActions?: React.ReactNode;
  /** Guard map — full job detail (same as Jobs tab) instead of peek + expand */
  layout?: 'peek' | 'detail';
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
  clientActions,
  detailActions,
  layout = 'peek',
}: MapSelectionExperienceProps) {
  const [expanded, setExpanded] = useState(layout === 'detail');

  const selected = useMemo(() => job, [job?.id]);

  React.useEffect(() => {
    setExpanded(layout === 'detail');
  }, [selected?.id, layout]);

  if (!selected) return null;

  const payLine =
    role === 'guard' ? (
      <JobBillingSummaryFromGuardJob job={selected as GuardJobView} />
    ) : (
      <JobBillingSummaryFromRequest req={selected as SecurityRequest} variant={role === 'staff' ? 'staff' : 'client'} />
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
        job={selected}
        role={role}
        route={route}
        loadingRoute={loadingRoute}
        layout={layout}
        expanded={expanded}
        onClose={() => {
          setExpanded(layout === 'detail');
          onClose();
        }}
        onExpand={layout === 'detail' ? undefined : () => setExpanded(true)}
        onPrimaryAction={layout === 'detail' ? undefined : onPrimaryAction}
        primaryLabel={layout === 'detail' ? undefined : primaryLabel}
      >
        {(layout === 'detail' || expanded) && (
          <>
            {role !== 'guard' && (
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
            {clientActions}
            {detailActions}
          </>
        )}
      </MapOfferCard>
    </div>
  );
}
