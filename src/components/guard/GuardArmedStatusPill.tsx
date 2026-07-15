import React from 'react';
import type { SecurityGuard } from '../../types';
import {
  computeGuardArmedStatus,
  GUARD_ARMED_STATUS_LABELS,
  GUARD_ARMED_STATUS_PILL_CLASS,
  type GuardArmedStatus,
} from '../../lib/guardArmedStatus';

interface GuardArmedStatusPillProps {
  guard: SecurityGuard;
  /** Override computed status (e.g. for previews). */
  status?: GuardArmedStatus;
  className?: string;
}

export function GuardArmedStatusPill({ guard, status, className = '' }: GuardArmedStatusPillProps) {
  const resolved = status ?? computeGuardArmedStatus(guard);
  return (
    <span className={`${GUARD_ARMED_STATUS_PILL_CLASS[resolved]} ${className}`.trim()}>
      {GUARD_ARMED_STATUS_LABELS[resolved]}
    </span>
  );
}
