import React from 'react';
import { SecurityGuard } from '../../types';
import {
  getGuardRosterAccountBadgeTone,
  getGuardRosterAccountLabel,
  getGuardUserStatus,
  GuardUserStatus,
} from '../../lib/accountStatus';
import { GUARD_TRUSTED_BADGE_LABEL, isGuardTrusted } from '../../lib/guardTrust';
import { WfBadge } from '../ui/wireframe';

/** Staff guard list badges — Approved / Active, then Background checked, then Trusted. */
export function GuardRosterStatusBadges({
  guard,
  className,
}: {
  guard: SecurityGuard;
  className?: string;
}) {
  return (
    <div className={`flex flex-nowrap items-center gap-1.5 ${className ?? ''}`.trim()}>
      <WfBadge tone={getGuardRosterAccountBadgeTone(guard)}>{getGuardRosterAccountLabel(guard)}</WfBadge>
      {guard.backgroundChecked && <WfBadge tone="primary">Background checked</WfBadge>}
      {isGuardTrusted(guard) && <WfBadge tone="success">{GUARD_TRUSTED_BADGE_LABEL}</WfBadge>}
    </div>
  );
}

export function guardRosterSortRank(guard: SecurityGuard): number {
  const status = getGuardUserStatus(guard);
  const statusRank: Record<GuardUserStatus, number> = {
    pending: 0,
    approved: 1,
    active: 2,
    suspended: 3,
    blocked: 4,
  };
  return statusRank[status];
}
