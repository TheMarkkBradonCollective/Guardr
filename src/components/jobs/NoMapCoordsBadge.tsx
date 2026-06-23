import React from 'react';
import { WfBadge } from '../ui/wireframe';
import { JOB_LOCATION_COORDS_MISSING_LABEL } from '../../lib/jobLocation';

export function NoMapCoordsBadge({ className }: { className?: string }) {
  return (
    <WfBadge tone="warning" className={className}>
      {JOB_LOCATION_COORDS_MISSING_LABEL}
    </WfBadge>
  );
}
