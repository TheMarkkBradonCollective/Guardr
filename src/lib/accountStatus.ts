import { Client, SecurityGuard } from '../types';

export type ClientAccountStatus = 'pending' | 'active' | 'suspended';
export type GuardUserStatus = 'pending' | 'active' | 'suspended' | 'blocked';

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
  return (guard.userStatus as GuardUserStatus) || 'pending';
}

export function isGuardAccountPending(guard: Pick<SecurityGuard, 'userStatus' | 'isStaff'>): boolean {
  return !guard.isStaff && getGuardUserStatus(guard) === 'pending';
}

export function isGuardAccountActive(guard: Pick<SecurityGuard, 'userStatus' | 'isStaff'>): boolean {
  return guard.isStaff || getGuardUserStatus(guard) === 'active';
}

export const CLIENT_ACCOUNT_STATUS_LABELS: Record<ClientAccountStatus, string> = {
  pending: 'Pending approval',
  active: 'Active',
  suspended: 'Suspended',
};

export const GUARD_USER_STATUS_LABELS: Record<GuardUserStatus, string> = {
  pending: 'Pending approval',
  active: 'Approved',
  suspended: 'Suspended',
  blocked: 'Blocked',
};
