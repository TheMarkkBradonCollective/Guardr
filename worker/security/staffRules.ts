/**
 * What each staff tier may change through /api/data/query.
 *
 * Mirrors the role ladder in src/lib/permissions.ts:
 *   Support < Moderator < Administrator < Manager < Director < Owner < Founder,
 *   plus the Finance desk (side role, may have no ladder role).
 * - Approving guards/clients: Moderator+
 * - Job review / status changes, deleting accounts or jobs, creating staff: Administrator+
 * - Money columns, the payments ledger, payout invoices: finance (Manager+ or Finance desk)
 * - Payment / fee / payout platform settings: Founder or Owner only
 *
 * Checks compare against the stored row, so re-sending an unchanged value is fine.
 */
import type { RequestIdentity } from '../../lib/auth/requestIdentity.ts';
import { hasFinancePlatformAccess } from '../../lib/accountSessionAuth.ts';

type Row = Record<string, unknown>;

export const STAFF_RANK: Record<string, number> = {
  Support: 1, Moderator: 2, Administrator: 3, Manager: 4, Director: 5, Owner: 6, Founder: 7,
};

export function staffRank(identity: RequestIdentity): number {
  return STAFF_RANK[identity.staffRole ?? ''] ?? 0;
}

export function isFinanceStaff(identity: RequestIdentity): boolean {
  return hasFinancePlatformAccess(identity.platformRole, identity.sideRole);
}

const MODERATOR = 2;
const ADMINISTRATOR = 3;
const DIRECTOR = 5;
const OWNER = 6;

/** Job columns that move money or record a payment (finance only). */
export const JOB_MONEY_COLS = new Set([
  'payment_status', 'stripe_payment_intent_id', 'stripe_session_id', 'tip_payment_status', 'tip_paid_at',
  'tip_stripe_payment_intent_id', 'tip_stripe_session_id', 'tip_amount', 'overtime_payment_status',
  'cash_deposited_amount', 'cash_deposited_to_stripe', 'cash_deposited_at', 'cash_deposited_manually',
  'cash_deposit_stripe_event_ids', 'platform_fee_paid_cash', 'platform_fee_per_hour',
  'early_clock_out_refund_status', 'early_clock_out_refund_amount', 'guard_payout_method',
  'guard_payout_available', 'guard_payout_available_at', 'overtime_guard_payout_available',
  'overtime_guard_payout_available_at', 'guard_cash_payout_requested', 'auto_payout_scheduled_at',
  'billing_snapshot', 'billing_snapshot_version', 'billing_snapshot_captured_at',
]);

/** Account approval columns on guards/clients (Moderator+). */
export const ACCOUNT_APPROVAL_COLS = new Set([
  'user_status', 'verified', 'approved', 'account_status', 'background_checked',
  'id_verification_status', 'guard_card_status', 'trusted', 'credential_expiry_restricted',
]);

/** Platform settings only the Founder/Owner may change. */
export const FOUNDER_SETTINGS_COLS = new Set([
  'payment_cash_enabled', 'payment_stripe_enabled', 'payment_square_enabled', 'fee_config',
  'auto_stripe_payout_enabled', 'auto_stripe_payout_delay_hours', 'owner_message',
  'owner_message_updated_at', 'staff_role_permissions', 'staff_compensation_config',
]);
const DIRECTOR_SETTINGS_COLS = new Set(['director_message', 'director_message_updated_at']);

const FINANCE_TABLES = new Set(['payments', 'guard_payout_invoices']);
const ACCOUNT_TABLES = new Set(['guards', 'clients', 'staff']);

function same(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (typeof a === 'number' || typeof b === 'number') {
    if (a == null || b == null || a === '' || b === '') return false;
    return Number(a) === Number(b);
  }
  if (typeof a === 'object' || typeof b === 'object') return JSON.stringify(a) === JSON.stringify(b);
  return String(a) === String(b);
}

/** Columns in `patch` whose value differs from every stored row (or all of them on insert). */
function changedCols(patch: Row, existing: Row[] | null): string[] {
  return Object.keys(patch).filter((k) => {
    if (!existing) return true;
    if (!existing.length) return false;
    return existing.some((row) => !same(row[k], patch[k]));
  });
}

/**
 * Returns an error message when this staff member may not make the write, else null.
 * `existing` = stored rows matched by the filters (update/upsert), or null for inserts.
 */
export function staffWriteDenial(
  identity: RequestIdentity,
  table: string,
  operation: 'insert' | 'update' | 'upsert' | 'delete',
  rows: Row[],
  existing: Row[] | null
): string | null {
  const rank = staffRank(identity);
  const finance = isFinanceStaff(identity);

  if (FINANCE_TABLES.has(table) && !finance) return 'Requires finance staff';
  if (table === 'staff_compensation_payouts' && rank < DIRECTOR) return 'Requires Director or above';

  if (operation === 'delete') {
    if ((ACCOUNT_TABLES.has(table) || table === 'security_requests') && rank < ADMINISTRATOR) {
      return 'Deleting accounts or jobs requires Administrator or above';
    }
    return null;
  }

  if (table === 'staff' && operation !== 'update' && rank < ADMINISTRATOR) {
    return 'Creating staff accounts requires Administrator or above';
  }
  if (table === 'staff' && operation === 'update' && rank < ADMINISTRATOR) {
    if ((existing ?? []).some((r) => r.id !== identity.profileId)) {
      return 'Editing other staff accounts requires Administrator or above';
    }
  }

  for (const row of rows) {
    const changed = changedCols(row, operation === 'insert' ? null : existing);
    if (table === 'platform_settings') {
      if (changed.some((k) => FOUNDER_SETTINGS_COLS.has(k)) && rank < OWNER) {
        return 'Only the Founder can change payment, fee, and payout settings';
      }
      if (changed.some((k) => DIRECTOR_SETTINGS_COLS.has(k)) && rank < DIRECTOR) {
        return 'Requires Director or above';
      }
      if (changed.length && rank < ADMINISTRATOR) return 'Changing platform settings requires Administrator or above';
    }
    if (table === 'security_requests') {
      const moneyChanged = changed.filter((k) => JOB_MONEY_COLS.has(k));
      if (operation === 'insert') {
        // A new job may start unpaid without finance rights.
        const unpaid = !('payment_status' in row) || row.payment_status == null || row.payment_status === 'unpaid';
        if (!unpaid && !finance) return 'Recording a payment requires finance staff';
      } else if (moneyChanged.length && !finance) {
        return 'Changing payment fields requires finance staff';
      }
      if (operation !== 'insert' && changed.includes('status') && rank < ADMINISTRATOR) {
        return 'Changing a job’s status requires Administrator or above';
      }
    }
    if (table === 'guards' || table === 'clients') {
      if (operation !== 'insert' && changed.some((k) => ACCOUNT_APPROVAL_COLS.has(k)) && rank < MODERATOR) {
        return 'Approving accounts requires Moderator or above';
      }
    }
    if (table === 'staff' && operation !== 'insert') {
      // Submitting your own ID for review is fine; approving or verifying a staff account
      // (including your own) is a Director decision, and nobody but the Founder self-approves.
      const approval = changed.filter(
        (k) => ACCOUNT_APPROVAL_COLS.has(k) && !(k === 'id_verification_status' && row[k] === 'pending')
      );
      if (approval.length) {
        const own = (existing ?? []).some((r) => r.id === identity.profileId);
        if (own && identity.staffRole !== 'Founder') return 'Staff cannot approve or verify their own account';
        if (rank < DIRECTOR) return 'Approving or verifying staff accounts requires Director or above';
      }
    }
  }
  return null;
}
