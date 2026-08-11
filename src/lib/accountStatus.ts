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
  if (guard.isStaff) {
    const normalized = normalizeGuardUserStatus(guard.userStatus);
    if (
      normalized === 'suspended' ||
      normalized === 'blocked' ||
      normalized === 'pending' ||
      normalized === 'approved' ||
      normalized === 'active'
    ) {
      return normalized;
    }
    return 'pending';
  }
  const normalized = normalizeGuardUserStatus(guard.userStatus);
  if (normalized) return normalized;
  return 'pending';
}

export function isStaffAccountPending(guard: Pick<SecurityGuard, 'userStatus' | 'isStaff'>): boolean {
  return Boolean(guard.isStaff && getGuardUserStatus(guard) === 'pending');
}

export function isStaffAccountApproved(guard: Pick<SecurityGuard, 'userStatus' | 'isStaff'>): boolean {
  return Boolean(guard.isStaff && getGuardUserStatus(guard) === 'approved');
}

/** Pending or approved — onboarding in progress, ops workspace locked. */
export function isStaffAccountPreActive(guard: Pick<SecurityGuard, 'userStatus' | 'isStaff'>): boolean {
  const status = getGuardUserStatus(guard);
  return Boolean(guard.isStaff && (status === 'pending' || status === 'approved'));
}

export function isStaffUserStatusActive(guard: Pick<SecurityGuard, 'userStatus' | 'isStaff'>): boolean {
  return Boolean(guard.isStaff && getGuardUserStatus(guard) === 'active');
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

export function isGuardAccountPending(guard: Pick<SecurityGuard, 'userStatus' | 'isStaff'>): boolean {
  return !guard.isStaff && getGuardUserStatus(guard) === 'pending';
}

export function isGuardAccountApproved(guard: Pick<SecurityGuard, 'userStatus' | 'isStaff'>): boolean {
  return !guard.isStaff && getGuardUserStatus(guard) === 'approved';
}

/** Database user_status only — does not verify credentials. */
export function isGuardUserStatusActive(guard: Pick<SecurityGuard, 'userStatus' | 'isStaff'>): boolean {
  if (guard.isStaff) return isStaffUserStatusActive(guard);
  return getGuardUserStatus(guard) === 'active';
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

export function clientRosterSortRank(client: Pick<Client, 'accountStatus'>): number {
  const status = getClientAccountStatus(client);
  const rank: Record<ClientAccountStatus, number> = {
    pending: 0,
    active: 1,
    suspended: 2,
  };
  return rank[status];
}

export const GUARD_USER_STATUS_LABELS: Record<GuardUserStatus, string> = {
  pending: 'Pending approval',
  approved: 'Approved',
  active: 'Active',
  suspended: 'Suspended',
  blocked: 'Blocked',
};

export function guardAccountDatabaseErrorMessage(
  error: { code?: string; message?: string },
  action: 'approve' | 'activate' | 'revision'
): string {
  const msg = error.message ?? '';
  if (msg.includes('user_status') || msg.includes('guards_user_status_check')) {
    return 'Database is missing the approved account status. Run supabase/complete_schema_setup.sql in Supabase SQL Editor, then try again.';
  }
  if (error.code === 'PGRST204' || msg.toLowerCase().includes('column')) {
    return 'Database schema is out of date. Run supabase/complete_schema_setup.sql in Supabase SQL Editor, then try again.';
  }
  const detail = msg.trim();
  if (detail) {
    if (action === 'approve') return `Could not approve guard profile: ${detail}`;
    if (action === 'revision') return `Could not request application revision: ${detail}`;
    return `Could not activate guard account: ${detail}`;
  }
  if (action === 'approve') return 'Could not approve guard profile. Please try again.';
  if (action === 'revision') return 'Could not request application revision. Please try again.';
  return 'Could not activate guard account. Please try again.';
}
