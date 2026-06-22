import React from 'react';
import { SecurityGuard } from '../../types';
import { GUARD_MISSING_CREDENTIALS_BADGE_LABEL, guardHasMissingWorkCredentials } from '../../lib/guardMissingCredentials';
import { WfBadge } from '../ui/wireframe';

interface GuardMissingCredentialsBadgeProps {
  guard: SecurityGuard;
  className?: string;
}

/** Staff-only badge for guards missing work-pathway credentials. */
export function GuardMissingCredentialsBadge({ guard, className }: GuardMissingCredentialsBadgeProps) {
  if (!guardHasMissingWorkCredentials(guard)) return null;
  return (
    <WfBadge tone="warning" className={className}>
      {GUARD_MISSING_CREDENTIALS_BADGE_LABEL}
    </WfBadge>
  );
}
