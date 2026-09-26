/** One person, one Guardr role. Nobody may be Guard and Customer, Customer and Staff, or Staff and Guard. */

export type OneRoleKind = 'guard' | 'client' | 'staff';
export type OneRoleMatchKind = 'email' | 'phone' | 'device';
export type OneRoleCaseStatus = 'open' | 'ignored' | 'blocked';

export const ONE_ROLE_POLICY_TITLE = 'One person, one role';

export const ONE_ROLE_POLICY_REASON =
  'Broke Guardr’s one-role rule. Nobody can be a Guard and a Customer, a Customer and Staff, or Staff and a Guard.';

export const ONE_ROLE_LOCK_MESSAGE =
  'Both accounts are locked while a manager reviews a one-role policy hold. You can only sign out and wait — there is no switch-account. Staff will either clear the hold or block both accounts.';

export const ONE_ROLE_DEVICE_ACCOUNT_MESSAGE =
  'This device is already tied to another Guardr account. One device, one account — you cannot sign in with a different account on this phone or browser. Use the original account or contact support.';

export const ONE_ROLE_SIGN_OUT_ONLY_COPY =
  'There is no switch account. Sign out, then sign in with the same Guardr account.';

export interface OneRoleAccountRef {
  kind: OneRoleKind;
  id: string;
  name: string;
  email: string;
  phone: string;
}

export interface OneRoleCase {
  id: string;
  status: OneRoleCaseStatus;
  reason: string;
  matchKind: OneRoleMatchKind;
  accounts: OneRoleAccountRef[];
  createdAt: string;
  reviewedAt?: string;
  reviewedByStaffId?: string;
}

export interface OneRoleDeviceAccount {
  kind: OneRoleKind;
  id: string;
}

/** Global device slot — shared across website tabs and installed PWAs on the same origin. */
export const ONE_ROLE_DEVICE_STORAGE_KEY = 'guardr_device_role_account_v1';

const LEGACY_SURFACE_PREFIX = `${ONE_ROLE_DEVICE_STORAGE_KEY}:`;

export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

export function normalizePhone(phone: string | null | undefined): string {
  return (phone ?? '').replace(/\D/g, '');
}

export function oneRoleKindLabel(kind: OneRoleKind): string {
  if (kind === 'client') return 'Customer';
  if (kind === 'staff') return 'Staff';
  return 'Guard';
}

export function describeOneRolePair(accounts: OneRoleAccountRef[]): string {
  const labels = [...new Set(accounts.map((account) => oneRoleKindLabel(account.kind)))];
  if (labels.length <= 1) return labels[0] ?? 'Guardr';
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')}, and ${labels[labels.length - 1]}`;
}

export function kindFromGuardLike(isStaff: boolean | undefined): OneRoleKind {
  return isStaff ? 'staff' : 'guard';
}

export function collectRoleAccounts(
  guards: { id: string; name: string; email: string; phone?: string; isStaff?: boolean }[],
  clients: { id: string; name: string; email: string; phone?: string }[],
): OneRoleAccountRef[] {
  const accounts: OneRoleAccountRef[] = guards.map((guard) => ({
    kind: kindFromGuardLike(guard.isStaff),
    id: guard.id,
    name: guard.name,
    email: guard.email,
    phone: guard.phone ?? '',
  }));
  for (const client of clients) {
    accounts.push({
      kind: 'client',
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone ?? '',
    });
  }
  return accounts;
}

function accountKey(account: Pick<OneRoleAccountRef, 'kind' | 'id'>): string {
  return `${account.kind}:${account.id}`;
}

/** Group accounts that share an email or a phone number. */
export function groupAccountsByIdentity(accounts: OneRoleAccountRef[]): OneRoleAccountRef[][] {
  const parent = new Map<string, string>();
  const find = (key: string): string => {
    const current = parent.get(key) ?? key;
    if (current !== key) {
      const root = find(current);
      parent.set(key, root);
      return root;
    }
    return current;
  };
  const union = (a: string, b: string) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parent.set(rootA, rootB);
  };

  const byEmail = new Map<string, string>();
  const byPhone = new Map<string, string>();

  for (const account of accounts) {
    const key = accountKey(account);
    parent.set(key, parent.get(key) ?? key);
    const email = normalizeEmail(account.email);
    if (email) {
      const existing = byEmail.get(email);
      if (existing) union(key, existing);
      else byEmail.set(email, key);
    }
    const phone = normalizePhone(account.phone);
    if (phone.length >= 7) {
      const existing = byPhone.get(phone);
      if (existing) union(key, existing);
      else byPhone.set(phone, key);
    }
  }

  const buckets = new Map<string, OneRoleAccountRef[]>();
  for (const account of accounts) {
    const root = find(accountKey(account));
    const list = buckets.get(root) ?? [];
    list.push(account);
    buckets.set(root, list);
  }
  return [...buckets.values()];
}

export function conflictingAccountsFor(
  accounts: OneRoleAccountRef[],
  seed: Pick<OneRoleAccountRef, 'kind' | 'id'>,
): OneRoleAccountRef[] | null {
  const group = groupAccountsByIdentity(accounts).find((item) =>
    item.some((account) => account.kind === seed.kind && account.id === seed.id),
  );
  if (!group) return null;
  const kinds = new Set(group.map((account) => account.kind));
  return kinds.size > 1 ? group : null;
}

function accountRefForDevice(
  accounts: OneRoleAccountRef[],
  device: OneRoleDeviceAccount,
): OneRoleAccountRef {
  const found = accounts.find((account) => account.kind === device.kind && account.id === device.id);
  if (found) return found;
  return {
    kind: device.kind,
    id: device.id,
    name: oneRoleKindLabel(device.kind),
    email: '',
    phone: '',
  };
}

export function withDeviceConflict(
  accounts: OneRoleAccountRef[],
  current: OneRoleAccountRef,
  device: OneRoleDeviceAccount | null,
): { accounts: OneRoleAccountRef[]; matchKind: OneRoleMatchKind } | null {
  const identityConflict = conflictingAccountsFor(accounts, current);
  if (identityConflict) {
    const matchKind: OneRoleMatchKind = identityConflict.some(
      (account) =>
        account.id !== current.id &&
        normalizeEmail(account.email) === normalizeEmail(current.email) &&
        normalizeEmail(current.email) !== '',
    )
      ? 'email'
      : 'phone';
    return { accounts: identityConflict, matchKind };
  }
  if (!device) return null;
  if (device.kind === current.kind && device.id === current.id) return null;
  const previous = accountRefForDevice(accounts, device);
  return { accounts: [previous, current], matchKind: 'device' };
}

export function caseInvolvesAccount(
  oneRoleCase: OneRoleCase,
  account: Pick<OneRoleAccountRef, 'kind' | 'id'>,
): boolean {
  return oneRoleCase.accounts.some((item) => item.kind === account.kind && item.id === account.id);
}

export function openHoldForAccount(
  cases: OneRoleCase[],
  account: Pick<OneRoleAccountRef, 'kind' | 'id'>,
): OneRoleCase | null {
  return (
    cases.find(
      (item) => (item.status === 'open' || item.status === 'blocked') && caseInvolvesAccount(item, account),
    ) ?? null
  );
}

export function kindFromSessionRole(role: string | null | undefined): OneRoleKind | null {
  if (role === 'client') return 'client';
  if (role === 'guard') return 'guard';
  if (
    role === 'staff' ||
    role === 'support' ||
    role === 'moderator' ||
    role === 'administrator' ||
    role === 'manager' ||
    role === 'director' ||
    role === 'owner' ||
    role === 'finance'
  ) {
    return 'staff';
  }
  return null;
}

export function buildOneRoleCase(input: {
  accounts: OneRoleAccountRef[];
  matchKind: OneRoleMatchKind;
  now?: string;
}): OneRoleCase {
  const createdAt = input.now ?? new Date().toISOString();
  return {
    id: `one-role-${createdAt.replace(/[^\d]/g, '').slice(0, 14)}-${input.accounts.map((account) => account.id).join('-')}`,
    status: 'open',
    reason: ONE_ROLE_POLICY_REASON,
    matchKind: input.matchKind,
    accounts: input.accounts,
    createdAt,
  };
}

export function ignoreOneRoleCase(
  oneRoleCase: OneRoleCase,
  staffId: string,
  now = new Date().toISOString(),
): OneRoleCase {
  return {
    ...oneRoleCase,
    status: 'ignored',
    reviewedAt: now,
    reviewedByStaffId: staffId,
  };
}

export function blockOneRoleCase(
  oneRoleCase: OneRoleCase,
  staffId: string,
  now = new Date().toISOString(),
): OneRoleCase {
  return {
    ...oneRoleCase,
    status: 'blocked',
    reviewedAt: now,
    reviewedByStaffId: staffId,
  };
}

function parseDeviceRoleAccount(raw: string | null): OneRoleDeviceAccount | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as OneRoleDeviceAccount;
    if (parsed?.kind && parsed?.id) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

/** Remove per-surface keys from an earlier release. */
export function clearLegacyPerSurfaceDeviceRoleKeys(): void {
  if (typeof window === 'undefined') return;
  try {
    const remove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key?.startsWith(LEGACY_SURFACE_PREFIX)) remove.push(key);
    }
    for (const key of remove) window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function readDeviceRoleAccount(): OneRoleDeviceAccount | null {
  if (typeof window === 'undefined') return null;
  clearLegacyPerSurfaceDeviceRoleKeys();
  try {
    return parseDeviceRoleAccount(window.localStorage.getItem(ONE_ROLE_DEVICE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function writeDeviceRoleAccount(account: OneRoleDeviceAccount): void {
  if (typeof window === 'undefined') return;
  clearLegacyPerSurfaceDeviceRoleKeys();
  try {
    window.localStorage.setItem(ONE_ROLE_DEVICE_STORAGE_KEY, JSON.stringify(account));
  } catch {
    /* ignore */
  }
}

export function canReviewOneRoleHolds(role: string | null | undefined): boolean {
  return role === 'administrator' || role === 'manager' || role === 'director' || role === 'owner';
}

export function matchKindLabel(matchKind: OneRoleMatchKind): string {
  if (matchKind === 'email') return 'Same email';
  if (matchKind === 'phone') return 'Same phone number';
  return 'Same device — another account';
}
