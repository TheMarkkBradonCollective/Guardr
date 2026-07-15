import React from 'react';
import { SecurityGuard } from '../../types';
import { getGuardRosterAccountBadges } from '../../lib/guardAccountActivation';
import { getGuardUserStatus } from '../../lib/accountStatus';
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

/** Staff guard list — account status badges (e.g. Approved + Active / Pending / Restricted). */
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
  const accountBadges = getGuardRosterAccountBadges(guard);

  return (
    <div className={`flex flex-col items-start gap-1.5 ${className ?? ''}`.trim()}>
      <div className="flex flex-wrap items-center gap-1.5">
        {accountBadges.map((badge, index) => (
          <WfBadge key={`${badge.label}-${index}`} tone={badge.tone}>
            {badge.label}
          </WfBadge>
        ))}
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
  const statusRank: Record<typeof status, number> = {
    pending: 0,
    approved: 1,
    active: 2,
    suspended: 3,
    blocked: 4,
  };
  return statusRank[status];
}
