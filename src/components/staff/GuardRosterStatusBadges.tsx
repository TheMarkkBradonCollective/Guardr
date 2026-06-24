import React from 'react';
import { SecurityGuard } from '../../types';
import {
  getGuardRosterAccountBadgeTone,
  getGuardRosterAccountLabel,
  getGuardUserStatus,
  GuardUserStatus,
} from '../../lib/accountStatus';
import {
  GUARD_APPROVED_BADGE_LABEL,
  GUARD_TRUSTED_BADGE_LABEL,
  isGuardProfileApproved,
  isGuardTrusted,
} from '../../lib/guardTrust';
import { guardCredentialGraceNotice } from '../../lib/guardCredentialGrace';
import { WfBadge } from '../ui/wireframe';

/** Staff guard list badges — Approved / Active, then Background checked, then Trusted. */
export function GuardRosterStatusBadges({
  guard,
  className,
}: {
  guard: SecurityGuard;
  className?: string;
}) {
  const graceNotice = guardCredentialGraceNotice(guard);

  return (
    <div className={`flex flex-col items-start gap-1.5 ${className ?? ''}`.trim()}>
      <div className="flex flex-nowrap items-center gap-1.5">
        <WfBadge tone={getGuardRosterAccountBadgeTone(guard)}>{getGuardRosterAccountLabel(guard)}</WfBadge>
        {isGuardProfileApproved(guard) && <WfBadge tone="success">{GUARD_APPROVED_BADGE_LABEL}</WfBadge>}
        {guard.backgroundChecked && <WfBadge tone="primary">Background checked</WfBadge>}
        {isGuardTrusted(guard) && <WfBadge tone="primary">{GUARD_TRUSTED_BADGE_LABEL}</WfBadge>}
      </div>
      {graceNotice && (
        <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400 leading-snug">
          {graceNotice.periodHours}h grace · {graceNotice.timeRemainingLabel} left
        </p>
      )}
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
