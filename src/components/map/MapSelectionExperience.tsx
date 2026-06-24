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
  /** Bottom offset when another sheet (e.g. guard browse) is visible */
  bottomOffsetClass?: string;
  /** Client approvals / payments rendered inside the expanded card */
  clientActions?: React.ReactNode;
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
}: MapSelectionExperienceProps) {
  const [expanded, setExpanded] = useState(false);

  const selected = useMemo(() => job, [job?.id]);

  React.useEffect(() => {
    setExpanded(false);
  }, [selected?.id]);

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
        expanded={expanded}
        onClose={() => {
          setExpanded(false);
          onClose();
        }}
        onExpand={() => setExpanded(true)}
        onPrimaryAction={onPrimaryAction}
        primaryLabel={primaryLabel}
      >
        <div className={`mt-3 overflow-y-auto overscroll-contain pr-1 -mr-1 ${clientActions ? 'max-h-[55vh]' : 'max-h-[42vh]'}`}>
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
          {clientActions}
        </div>
      </MapOfferCard>
    </div>
  );
}
