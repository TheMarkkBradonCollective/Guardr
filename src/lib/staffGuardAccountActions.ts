import type { GuardUserStatus } from './accountStatus';

/** Guard can be temporarily deactivated (user_status → suspended). */
export function guardCanDeactivateAccount(status: GuardUserStatus): boolean {
  return status === 'active' || status === 'approved';
}

/** Guard can be blocked from platform access (user_status → blocked). */
export function guardCanBlockAccount(status: GuardUserStatus): boolean {
  return status === 'active' || status === 'approved' || status === 'suspended';
}

/** Suspended or blocked guards can be restored to active when eligible. */
export function guardCanRestoreAccountAccess(status: GuardUserStatus): boolean {
  return status === 'suspended' || status === 'blocked';
}

/** Pending applications can be denied (blocks the account). */
export function guardCanDenyApplication(status: GuardUserStatus): boolean {
  return status === 'pending';
}
