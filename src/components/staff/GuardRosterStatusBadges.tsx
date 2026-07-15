import React from 'react';
import { SecurityGuard } from '../../types';
import {
  getGuardRosterAccountBadgeTone,
  getGuardRosterAccountLabel,
} from '../../lib/guardAccountActivation';
import { getGuardUserStatus, type GuardUserStatus } from '../../lib/accountStatus';
import {
  GUARD_TRUSTED_BADGE_LABEL,
  isGuardProfileApproved,
  isGuardTrusted,
} from '../../lib/guardTrust';
import { guardCredentialGraceNotice } from '../../lib/guardCredentialGrace';
import {
  guardCredentialRestrictedDetail,
  isGuardCredentialExpiryRestricted,
} from '../../lib/guardCredentialExpiryEnforcement';
import { WfBadge } from '../ui/wireframe';

/** Staff guard list — one primary account status badge (pending / approved / active / suspended / blocked). */
export function GuardRosterStatusBadges({
  guard,
  className,
  showTrusted = true,
}: {
  guard: SecurityGuard;
  className?: string;
  showTrusted?: boolean;
}) {
  const graceNotice = guardCredentialGraceNotice(guard);
  const restricted = isGuardCredentialExpiryRestricted(guard);
  const restrictedDetail = guardCredentialRestrictedDetail(guard);
  const status = getGuardUserStatus(guard);
  const isApproved = isGuardProfileApproved(guard);
  const showTrustedBadge =
    showTrusted && isGuardTrusted(guard) && isApproved && status === 'active';

  return (
    <div className={`flex flex-col items-start gap-1.5 ${className ?? ''}`.trim()}>
      <div className="flex flex-wrap items-center gap-1.5">
        <WfBadge tone={getGuardRosterAccountBadgeTone(guard)}>
          {getGuardRosterAccountLabel(guard)}
        </WfBadge>
        {showTrustedBadge && <WfBadge tone="primary">{GUARD_TRUSTED_BADGE_LABEL}</WfBadge>}
      </div>
      {restricted && restrictedDetail && (
        <p className="text-[10px] font-medium text-red-500 dark:text-red-400 leading-snug">
          {restrictedDetail}
        </p>
      )}
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
