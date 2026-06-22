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
  const normalized = normalizeGuardUserStatus(guard.userStatus);
  if (normalized) return normalized;
  return 'pending';
}

function normalizeGuardUserStatus(raw: unknown): GuardUserStatus | null {
  if (typeof raw !== 'string') return null;
  const status = raw.trim().toLowerCase();
  if (
    status === 'pending' ||
    status === 'approved' ||
    status === 'active' ||
    status === 'suspended' ||
    status === 'blocked'
  ) {
    return status;
  }
  return null;
}

/** Staff guard list — account lifecycle label (not work-pathway Active). */
export function getGuardRosterAccountLabel(guard: SecurityGuard): string {
  const status = getGuardUserStatus(guard);
  if (isGuardAccountApproved(guard)) return GUARD_USER_STATUS_LABELS.approved;
  return GUARD_USER_STATUS_LABELS[status];
}

export function getGuardRosterAccountBadgeTone(
  guard: SecurityGuard
): 'default' | 'primary' | 'success' | 'warning' | 'danger' {
  const status = getGuardUserStatus(guard);
  if (isGuardAccountApproved(guard)) return 'primary';
  if (status === 'active') return 'success';
  if (status === 'pending') return 'warning';
  if (status === 'suspended' || status === 'blocked') return 'danger';
  return 'default';
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

export function guardAccountDatabaseErrorMessage(
  error: { code?: string; message?: string },
  action: 'approve' | 'activate'
): string {
  const msg = error.message ?? '';
  if (msg.includes('user_status') || msg.includes('guards_user_status_check')) {
    return 'Could not save — run the latest database migration (guard approved status), then try again.';
  }
  if (error.code === 'PGRST204' || msg.includes('column')) {
    return 'Could not save — run the latest database migrations, then try again.';
  }
  return action === 'approve'
    ? 'Could not approve guard profile. Please try again.'
    : 'Could not activate guard account. Please try again.';
}
