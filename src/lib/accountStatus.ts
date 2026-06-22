import { Client, SecurityGuard } from '../types';

export type ClientAccountStatus = 'pending' | 'active' | 'suspended';
export type GuardUserStatus = 'pending' | 'approved' | 'active' | 'suspended' | 'blocked';

export function getClientAccountStatus(client: Pick<Client, 'accountStatus' | 'approved'>): ClientAccountStatus {
  if (client.accountStatus) return client.accountStatus;
  return client.approved === false ? 'suspended' : 'active';
}

export function isClientAccountPending(client: Pick<Client, 'accountStatus' | 'approved'>): boolean {
  return getClientAccountStatus(client) === 'pending';
}

export function isClientAccountActive(client: Pick<Client, 'accountStatus' | 'approved'>): boolean {
  return getClientAccountStatus(client) === 'active';
}

export function getGuardUserStatus(guard: Pick<SecurityGuard, 'userStatus' | 'isStaff'>): GuardUserStatus {
  if (guard.isStaff) return 'active';
  const status = guard.userStatus as GuardUserStatus | undefined;
  if (status === 'approved' || status === 'active' || status === 'suspended' || status === 'blocked') {
    return status;
  }
  return 'pending';
}

export function isGuardAccountPending(guard: Pick<SecurityGuard, 'userStatus' | 'isStaff'>): boolean {
  return !guard.isStaff && getGuardUserStatus(guard) === 'pending';
}

export function isGuardAccountApproved(guard: Pick<SecurityGuard, 'userStatus' | 'isStaff'>): boolean {
  return !guard.isStaff && getGuardUserStatus(guard) === 'approved';
}

export function isGuardAccountActive(guard: Pick<SecurityGuard, 'userStatus' | 'isStaff'>): boolean {
  return guard.isStaff || getGuardUserStatus(guard) === 'active';
}

/** Pending or approved — not yet active for field work. */
export function isGuardAccountPreActive(guard: Pick<SecurityGuard, 'userStatus' | 'isStaff'>): boolean {
  const status = getGuardUserStatus(guard);
  return !guard.isStaff && (status === 'pending' || status === 'approved');
}

export const CLIENT_ACCOUNT_STATUS_LABELS: Record<ClientAccountStatus, string> = {
  pending: 'Pending approval',
  active: 'Active',
  suspended: 'Suspended',
};

export const GUARD_USER_STATUS_LABELS: Record<GuardUserStatus, string> = {
  pending: 'Pending approval',
  approved: 'Approved',
  active: 'Active',
  suspended: 'Suspended',
  blocked: 'Blocked',
};
