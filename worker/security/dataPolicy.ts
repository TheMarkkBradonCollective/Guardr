/**
 * Row and column policy for the generic /api/data/query endpoint.
 *
 * - Every request needs a verified JWT identity (role re-read from the database).
 * - Password columns are never returned and never writable through this endpoint.
 * - Clients and guards only touch their own rows; payment, approval, and role
 *   columns are server/staff only. Unfiltered UPDATE/DELETE is refused for everyone.
 * - Staff role changes need Director+, and only the Founder/Owner can grant
 *   Founder/Owner.
 */
import type { RequestIdentity } from '../../lib/auth/requestIdentity.ts';
import { isStaffPlatformRole } from '../../lib/accountSessionAuth.ts';

export type Operation = 'select' | 'insert' | 'update' | 'delete' | 'upsert';
type Kind = 'guard' | 'client';

export interface TablePolicy {
  /** What non-staff may read: every row, only rows they own, or nothing. */
  read: 'all' | 'own' | 'none';
  /** Non-staff writes: 'own' (insert/update own rows), 'none'. */
  write: 'own' | 'none';
  /** May non-staff delete their own rows? */
  deleteOwn?: boolean;
  /** Owner columns by account kind. A row is "owned" when any listed column equals the caller's id. */
  owner?: Partial<Record<Kind, string[]>>;
  /** Extra columns non-staff may never set. */
  protectedCols?: string[];
  /** Values a non-staff caller may give a protected column when creating a row. */
  initialValues?: Record<string, unknown[]>;
  /** Non-staff guards may also update rows matching these column=value pairs (e.g. open jobs). */
  guardSharedUpdate?: Array<[string, string]>;
}

/** Never returned to any caller and never writable through /api/data/query. */
export const SECRET_COLUMNS = new Set(['password', 'password_hash', 'auth_user_id']);

const ACCOUNT_CONTROL = [
  'is_staff', 'staff_role', 'side_role', 'user_status', 'verified', 'background_checked',
  'id_verification_status', 'guard_card_status', 'stripe_connect_account_id',
  'migrated_to_staff_at', 'approved', 'account_status', 'email', 'personal_email',
  'rating', 'jobs_completed',
];

const JOB_MONEY = [
  'payment_status', 'stripe_payment_intent_id', 'stripe_session_id', 'tip_payment_status',
  'tip_paid_at', 'tip_stripe_payment_intent_id', 'tip_stripe_session_id', 'overtime_payment_status',
  'cash_deposited_amount', 'platform_fee_paid_cash', 'platform_fee_per_hour',
  'early_clock_out_refund_status', 'early_clock_out_refund_amount', 'guard_payout_method',
  'guard_cash_payout_requested', 'staff_approved_guard_at', 'client_id',
];

const REVIEW_STATUS = ['status', 'verified', 'verified_at', 'verified_by', 'reviewed_by', 'reviewed_at', 'approved_at', 'approved_by'];

const G = (...cols: string[]) => ({ guard: cols });
const C = (...cols: string[]) => ({ client: cols });

export const TABLE_POLICIES: Record<string, TablePolicy> = {
  guards: { read: 'all', write: 'own', owner: G('id'), protectedCols: ACCOUNT_CONTROL },
  staff: { read: 'all', write: 'none' },
  clients: { read: 'all', write: 'own', owner: C('id'), protectedCols: ACCOUNT_CONTROL },
  certifications: {
    read: 'all', write: 'own', deleteOwn: true, owner: G('guard_id'), protectedCols: REVIEW_STATUS,
    initialValues: { status: ['pending', 'submitted', 'pending_review'] },
  },
  experience: { read: 'all', write: 'own', deleteOwn: true, owner: G('guard_id') },
  education: { read: 'all', write: 'own', deleteOwn: true, owner: G('guard_id') },
  security_requests: {
    read: 'all',
    write: 'own',
    owner: { client: ['client_id'], guard: ['assigned_guard_id', 'pending_guard_id', 'target_guard_id'] },
    protectedCols: JOB_MONEY,
    guardSharedUpdate: [['status', 'open']],
  },
  payments: { read: 'none', write: 'none' },
  guard_payout_invoices: {
    read: 'own', write: 'own', owner: G('guard_id'), protectedCols: ['status', 'resolved_at'],
    initialValues: { status: ['pending'] },
  },
  support_tickets: { read: 'own', write: 'own', owner: { guard: ['user_id'], client: ['user_id'] } },
  support_messages: { read: 'all', write: 'own', owner: { guard: ['sender_id'], client: ['sender_id'] } },
  push_subscriptions: { read: 'own', write: 'own', deleteOwn: true, owner: { guard: ['user_id'], client: ['user_id'] } },
  job_chat_threads: { read: 'own', write: 'own', owner: { guard: ['guard_id'], client: ['client_id'] } },
  job_chat_messages: { read: 'all', write: 'own', deleteOwn: true, owner: { guard: ['sender_id'], client: ['sender_id'] } },
  staff_messages: { read: 'none', write: 'none' },
  guard_messages: { read: 'all', write: 'own', deleteOwn: true, owner: G('sender_id') },
  client_messages: { read: 'all', write: 'own', deleteOwn: true, owner: C('sender_id') },
  message_reactions: { read: 'all', write: 'own', deleteOwn: true, owner: { guard: ['user_id'], client: ['user_id'] } },
  chat_read_receipts: { read: 'own', write: 'own', owner: { guard: ['user_id'], client: ['user_id'] } },
  user_notifications: { read: 'own', write: 'own', owner: { guard: ['user_id', 'guard_id'], client: ['user_id'] } },
  audit_log: { read: 'none', write: 'own', owner: { guard: ['actor_id'], client: ['actor_id'] } },
  guard_availability: { read: 'all', write: 'own', deleteOwn: true, owner: G('guard_id') },
  guard_availability_date_overrides: { read: 'all', write: 'own', deleteOwn: true, owner: G('guard_id') },
  client_locations: { read: 'own', write: 'own', deleteOwn: true, owner: C('client_id') },
  job_locations: { read: 'all', write: 'own', owner: C('created_by_client_id') },
  recurring_shift_templates: { read: 'own', write: 'own', deleteOwn: true, owner: C('client_id') },
  compliance_alerts: { read: 'own', write: 'none', owner: { guard: ['guard_id'], client: ['client_id'] } },
  client_invoices: { read: 'own', write: 'none', owner: C('client_id') },
  device_account_bindings: {
    read: 'own', write: 'own', owner: { guard: ['account_id'], client: ['account_id'] },
  },
  one_role_cases: { read: 'none', write: 'none' },
  platform_settings: { read: 'all', write: 'none' },
  platform_cities: { read: 'all', write: 'none' },
  company_public_documents: { read: 'all', write: 'none' },
  guard_insurance_policies: {
    read: 'own', write: 'own', owner: G('guard_id'), protectedCols: REVIEW_STATUS,
    initialValues: { status: ['pending', 'submitted', 'pending_review'] },
  },
  notification_preferences: { read: 'own', write: 'own', owner: { guard: ['user_id'], client: ['user_id'] } },
  staff_time_entries: { read: 'none', write: 'none' },
  job_guard_slots: {
    read: 'all',
    write: 'own',
    owner: G('guard_id', 'invited_by_guard_id'),
    protectedCols: ['staff_approved_at', 'client_approved_at'],
  },
  user_legal_acceptances: { read: 'own', write: 'own', owner: { guard: ['user_id'], client: ['user_id'] } },
  guard_vehicle_insurance_policies: {
    read: 'own', write: 'own', owner: G('guard_id'), protectedCols: REVIEW_STATUS,
    initialValues: { status: ['pending', 'submitted', 'pending_review'] },
  },
  guard_vehicle_profiles: {
    read: 'all', write: 'own', owner: G('guard_id'), protectedCols: REVIEW_STATUS,
    initialValues: { status: ['pending', 'submitted', 'pending_review'] },
  },
  staff_compensation_payouts: { read: 'none', write: 'none' },
};

export const ALLOWED_TABLES = new Set(Object.keys(TABLE_POLICIES));

export type Filter =
  | { col: string; op: 'eq'; val?: unknown }
  | { col: string; op: 'neq'; val?: unknown }
  | { col: string; op: 'in'; vals?: unknown[] };

export interface QueryPlan {
  ok: true;
  /** Extra OR-group the caller must also match ("col.eq.val,col2.eq.val"). */
  ownerOr: string | null;
  payload: Record<string, unknown> | Record<string, unknown>[] | undefined;
  /** For non-staff upserts: existing rows with these key values must be owned by the caller. */
  upsertCheck: { col: string; vals: unknown[] } | null;
  /** True when nothing is left to write after stripping protected columns. */
  noop?: boolean;
}
export interface QueryDenied {
  ok: false;
  status: 400 | 401 | 403;
  error: string;
}

const ID_SAFE = /^[A-Za-z0-9_.:@-]+$/;

function isStaff(identity: RequestIdentity): boolean {
  return isStaffPlatformRole(identity.platformRole);
}

function kindOf(identity: RequestIdentity): Kind {
  return identity.platformRole === 'client' ? 'client' : 'guard';
}

export function ownerColumns(policy: TablePolicy, identity: RequestIdentity): string[] {
  return policy.owner?.[kindOf(identity)] ?? [];
}

function ownerOrExpr(cols: string[], id: string, shared: Array<[string, string]> = []): string {
  return [...cols.map((c) => `${c}.eq.${id}`), ...shared.map(([c, v]) => `${c}.eq.${v}`)].join(',');
}

const STAFF_ROLE_RANK: Record<string, number> = {
  Support: 1, Moderator: 2, Administrator: 3, Manager: 4, Director: 5, Owner: 6, Founder: 7,
};

function checkStaffRoleChange(
  identity: RequestIdentity,
  rows: Record<string, unknown>[]
): string | null {
  for (const row of rows) {
    const touchesRole = ['staff_role', 'is_staff', 'side_role'].some((k) => k in row);
    if (!touchesRole) continue;
    const callerRank = STAFF_ROLE_RANK[identity.staffRole ?? ''] ?? 0;
    if (callerRank < STAFF_ROLE_RANK.Director) return 'Changing staff roles requires Director or above';
    const target = typeof row.staff_role === 'string' ? row.staff_role : null;
    if (target && (STAFF_ROLE_RANK[target] ?? 0) >= STAFF_ROLE_RANK.Owner && callerRank < STAFF_ROLE_RANK.Owner) {
      return 'Only the Founder can grant Founder or Owner';
    }
    if (target === 'Founder' && identity.staffRole !== 'Founder') {
      return 'Only the Founder can grant Founder';
    }
  }
  return null;
}

/** Strip secret columns; enforce protected/owner columns. Returns error text or null. */
function sanitizeRows(
  table: string,
  policy: TablePolicy,
  identity: RequestIdentity,
  rows: Record<string, unknown>[],
  operation: Operation
): string | null {
  const staff = isStaff(identity);
  for (const row of rows) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return 'Invalid payload';
    for (const key of Object.keys(row)) {
      if (SECRET_COLUMNS.has(key)) delete row[key];
    }
    if (staff) continue;
    for (const key of policy.protectedCols ?? []) {
      if (!(key in row)) continue;
      const creating = operation === 'insert' || operation === 'upsert';
      const initial = policy.initialValues?.[key];
      if (creating && initial && initial.includes(row[key])) continue;
      // Re-sending your own id in an owner column is fine (e.g. client_id on your own job).
      if (row[key] === identity.profileId && ownerColumns(policy, identity).includes(key)) continue;
      // Server/staff-only column: silently ignore the client's value.
      delete row[key];
    }
    const cols = ownerColumns(policy, identity);
    if (operation === 'insert' || operation === 'upsert') {
      if (!cols.length) return 'Not allowed';
      const owned = cols.some((c) => row[c] === identity.profileId);
      if (!owned) {
        if (cols[0] in row && row[cols[0]] != null) return 'You can only create your own records';
        row[cols[0]] = identity.profileId;
      }
    }
    if (operation === 'update') {
      // Do not let a caller hand their row to someone else.
      for (const c of cols) {
        if (c in row && row[c] !== identity.profileId && row[c] !== null) {
          if (table === 'security_requests' && kindOf(identity) === 'guard' && row[c] === identity.profileId) continue;
          return `Not allowed to set ${c}`;
        }
      }
    }
  }
  if (staff && (table === 'staff' || table === 'guards')) {
    return checkStaffRoleChange(identity, rows);
  }
  return null;
}

export function planQuery(
  identity: RequestIdentity | null,
  table: string,
  operation: Operation,
  filters: Filter[],
  payload: Record<string, unknown> | Record<string, unknown>[] | undefined,
  upsertConflict: string | undefined
): QueryPlan | QueryDenied {
  if (!identity) return { ok: false, status: 401, error: 'Unauthorized' };
  const policy = TABLE_POLICIES[table];
  if (!policy) return { ok: false, status: 403, error: 'Table not allowed' };
  if (!['select', 'insert', 'update', 'delete', 'upsert'].includes(operation)) {
    return { ok: false, status: 400, error: 'Invalid operation' };
  }
  if (!ID_SAFE.test(identity.profileId)) return { ok: false, status: 403, error: 'Invalid account id' };

  if ((operation === 'update' || operation === 'delete') && filters.length === 0) {
    return { ok: false, status: 400, error: 'Update and delete need a filter' };
  }
  for (const f of filters) {
    if (SECRET_COLUMNS.has(f.col)) return { ok: false, status: 403, error: 'Not allowed' };
  }

  const staff = isStaff(identity);
  const cols = ownerColumns(policy, identity);

  if (operation === 'select') {
    if (staff || policy.read === 'all') return { ok: true, ownerOr: null, payload: undefined, upsertCheck: null };
    // Nothing this caller may see: answer with an empty list (no rows, no error toast).
    if (policy.read === 'none' || !cols.length) {
      return { ok: true, ownerOr: null, payload: undefined, upsertCheck: null, noop: true };
    }
    return { ok: true, ownerOr: ownerOrExpr(cols, identity.profileId), payload: undefined, upsertCheck: null };
  }

  if (!staff) {
    if (policy.write === 'none' || !cols.length) return { ok: false, status: 403, error: 'Not allowed' };
    if (operation === 'delete' && !policy.deleteOwn) return { ok: false, status: 403, error: 'Not allowed' };
  }

  let rows: Record<string, unknown>[] = [];
  if (operation !== 'delete') {
    if (payload == null) return { ok: false, status: 400, error: 'Missing payload' };
    rows = Array.isArray(payload) ? payload : [payload];
    if (operation === 'update' && Array.isArray(payload)) return { ok: false, status: 400, error: 'Invalid payload' };
    if (!rows.length) return { ok: false, status: 400, error: 'Missing payload' };
    const err = sanitizeRows(table, policy, identity, rows, operation);
    if (err) return { ok: false, status: 403, error: err };
    if (rows.every((r) => Object.keys(r).length === 0)) {
      return { ok: true, ownerOr: null, payload, upsertCheck: null, noop: true };
    }
    if (rows.some((r) => Object.keys(r).length === 0)) return { ok: false, status: 400, error: 'Invalid payload' };
  }

  if (staff) return { ok: true, ownerOr: null, payload, upsertCheck: null };

  if (operation === 'update' || operation === 'delete') {
    const shared = operation === 'update' && kindOf(identity) === 'guard' ? policy.guardSharedUpdate ?? [] : [];
    return { ok: true, ownerOr: ownerOrExpr(cols, identity.profileId, shared), payload, upsertCheck: null };
  }

  if (operation === 'upsert') {
    const conflictCols = (upsertConflict ?? 'id').split(',').map((c) => c.trim()).filter(Boolean);
    if (conflictCols.some((c) => cols.includes(c))) {
      return { ok: true, ownerOr: null, payload, upsertCheck: null };
    }
    if (conflictCols.length === 1) {
      const col = conflictCols[0];
      const vals = rows.map((r) => r[col]);
      if (vals.some((v) => v === undefined || v === null)) {
        return { ok: true, ownerOr: null, payload, upsertCheck: null };
      }
      return { ok: true, ownerOr: null, payload, upsertCheck: { col, vals } };
    }
    return { ok: false, status: 403, error: 'Not allowed' };
  }

  return { ok: true, ownerOr: null, payload, upsertCheck: null };
}

/** Remove secret columns from returned rows. */
export function redactRows(data: unknown): unknown {
  const strip = (row: unknown) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return row;
    const copy = { ...(row as Record<string, unknown>) };
    for (const k of SECRET_COLUMNS) delete copy[k];
    return copy;
  };
  return Array.isArray(data) ? data.map(strip) : strip(data);
}
