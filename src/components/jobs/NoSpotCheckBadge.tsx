import React from 'react';
import { WfBadge } from '../ui/wireframe';
import { NO_SPOT_CHECK_LABEL } from '../../lib/spotChecks';

export function NoSpotCheckBadge({ className }: { className?: string }) {
  return (
    <WfBadge tone="warning" className={className}>
      {NO_SPOT_CHECK_LABEL}
    </WfBadge>
  );
}
