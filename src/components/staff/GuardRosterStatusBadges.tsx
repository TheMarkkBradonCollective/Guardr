import React from 'react';
import { SecurityGuard } from '../../types';
import { getGuardUserStatus, GUARD_USER_STATUS_LABELS, GuardUserStatus } from '../../lib/accountStatus';
import { GUARD_TRUSTED_BADGE_LABEL, isGuardTrusted } from '../../lib/guardTrust';
import { WfBadge } from '../ui/wireframe';

function guardAccountBadgeTone(
  status: GuardUserStatus
): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
  if (status === 'active') return 'success';
  if (status === 'approved') return 'primary';
  if (status === 'pending') return 'warning';
  return 'danger';
}

/** Staff guard list badges — Approved / Active, then Background checked, then Trusted. */
export function GuardRosterStatusBadges({
  guard,
  className,
}: {
  guard: SecurityGuard;
  className?: string;
}) {
  const accountStatus = getGuardUserStatus(guard);

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className ?? ''}`.trim()}>
      <WfBadge tone={guardAccountBadgeTone(accountStatus)}>{GUARD_USER_STATUS_LABELS[accountStatus]}</WfBadge>
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
