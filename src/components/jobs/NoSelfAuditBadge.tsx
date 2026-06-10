import React from 'react';
import { WfBadge } from '../ui/wireframe';
import { NO_SELF_AUDIT_LABEL } from '../../lib/selfAuditPhotos';

export function NoSelfAuditBadge({ className }: { className?: string }) {
  return (
    <WfBadge tone="warning" className={className}>
      {NO_SELF_AUDIT_LABEL}
    </WfBadge>
  );
}
