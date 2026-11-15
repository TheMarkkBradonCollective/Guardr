/**
 * Column and status rules for clients and guards writing security_requests
 * (jobs) through /api/data/query. Staff are not limited here.
 *
 * Status changes are explicit actions: an invalid transition rejects the whole
 * request. Other columns the caller may not touch are dropped; if nothing
 * allowed remains, the request is rejected.
 */
import type { RequestIdentity } from '../../lib/auth/requestIdentity.ts';

type Row = Record<string, unknown>;
export type JobDecision = { ok: true; patch: Row } | { ok: false; error: string };

const PRE_ACCEPT = new Set(['draft', 'pending-review', 'open']);

/** Guard work-in-progress columns on a job assigned to that guard. */
const GUARD_ASSIGNED_COLS = new Set([
  'en_route_at', 'arrived_at', 'guard_live_location', 'check_in_audit', 'mid_shift_audits',
  'check_out_audit', 'shift_breaks', 'shift_audit_violations', 'self_audit',
  'briefing_acknowledgments', 'post_orders_acknowledgments', 'overtime_guard_approved_at',
  'early_clock_out_actual_hours', 'replacement_request',
  'activity_log', 'reports', 'spot_checks', 'client_violation_reports', 'price_negotiations',
  'status',
]);

/** Client columns on its own job (money/approval columns are stripped earlier). */
const CLIENT_LOCKED_COLS = new Set([
  'opened_at', 'staff_approved_guard_at', 'en_route_at', 'arrived_at', 'guard_live_location',
  'check_in_audit', 'mid_shift_audits', 'check_out_audit', 'shift_breaks', 'self_audit',
  'overtime_guard_approved_at', 'overtime_hours', 'overtime_amount', 'guard_payout_available',
  'guard_payout_available_at', 'overtime_guard_payout_available', 'overtime_guard_payout_available_at',
  'scheduled_duration_hours', 'scheduled_estimated_payout', 'early_clock_out_actual_hours',
  'applicants', 'pending_guard_id', 'location_risk_level', 'trusted', 'overtime_original_hours',
  'overtime_original_amount', 'overtime_dispute_resolved_at', 'overtime_dispute_resolution',
]);
/** Overtime states a client may move to from pending_client (approve or dispute). */
const CLIENT_OVERTIME_MOVES: Record<string, string[]> = {
  pending_client: ['awaiting_payment', 'disputed'],
};
const CLIENT_CANCEL_FROM = new Set(['draft', 'pending-review', 'open', 'accepted', 'in-progress']);
const MAX_OVERTIME_HOURS = 12;

const PAID_STATES = new Set(['paid', 'held', 'released']);

/**
 * True when a guard's patch on a job that is not yet theirs takes on work: applying,
 * holding it as pending, or accepting a direct/replacement offer. Withdrawing never counts.
 */
export function guardPatchTakesWork(old: Row, patch: Row, self: string): boolean {
  if (old.assigned_guard_id === self) return false;
  if (patch.assigned_guard_id === self || patch.pending_guard_id === self) return true;
  if ('applicants' in patch) {
    const before = new Set(asList(old.applicants));
    return asList(patch.applicants).some((id) => id === self && !before.has(id));
  }
  return false;
}

/** Only an active guard account (or a staff member working as a guard) may take on jobs. */
export function guardMayTakeWork(guard: { user_status?: unknown; is_staff?: unknown } | null | undefined): boolean {
  if (!guard) return false;
  if (guard.is_staff === true) return true;
  return guard.user_status === 'active';
}

/**
 * A client may move or shorten a paid shift, but a longer shift costs more and needs staff
 * approval (the app files it as a pending schedule change). Returns an error or null.
 */
export function paidShiftLengthened(old: Row, patch: Row): string | null {
  if (!PAID_STATES.has(String(old.payment_status ?? ''))) return null;
  if (!('duration_hours' in patch) && !('start_date' in patch) && !('end_date' in patch)) return null;
  const paidHours = Number(old.scheduled_duration_hours ?? old.duration_hours) || 0;
  if (paidHours <= 0) return null;
  const tooLong = 'Longer shifts on a paid job need staff approval. Request a schedule change instead.';
  if ('duration_hours' in patch && Number(patch.duration_hours) > paidHours + 0.01) return tooLong;
  if ('start_date' in patch || 'end_date' in patch) {
    const start = Date.parse(String(patch.start_date ?? old.start_date ?? ''));
    const end = Date.parse(String(patch.end_date ?? old.end_date ?? ''));
    if (Number.isFinite(start) && Number.isFinite(end) && (end - start) / 3_600_000 > paidHours + 0.01) return tooLong;
  }
  return null;
}

function roundMoney(v: number): number {
  return Math.round(v * 100) / 100;
}

function checkedAt(audit: unknown): string | null {
  let a = audit;
  if (typeof a === 'string') {
    try {
      a = JSON.parse(a);
    } catch {
      return null;
    }
  }
  const v = a && typeof a === 'object' ? (a as Record<string, unknown>).checkedAt : null;
  return typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? v : null;
}

function overtimeClaimed(audit: unknown): boolean {
  let a = audit;
  if (typeof a === 'string') {
    try {
      a = JSON.parse(a);
    } catch {
      return false;
    }
  }
  return !!a && typeof a === 'object' && (a as Record<string, unknown>).overtimeClaimed === true;
}

/**
 * Overtime at clock-out, computed from the stored job: worked time (check-in to
 * check-out, check-out no later than now) minus scheduled hours, capped at 12h.
 */
export function serverOvertime(old: Row, checkOutAudit: unknown, now = Date.now()): Row | null {
  if (!overtimeClaimed(checkOutAudit)) return null;
  if (old.overtime_status && old.overtime_status !== 'none') return null;
  const outRaw = checkedAt(checkOutAudit);
  if (!outRaw) return null;
  const out = Math.min(Date.parse(outRaw), now);
  const scheduled = Number(old.duration_hours ?? 0);
  const inAt = checkedAt(old.check_in_audit);
  let hours = 0;
  if (inAt) {
    hours = (out - Date.parse(inAt)) / 3_600_000 - scheduled;
  } else if (old.end_date) {
    hours = (out - Date.parse(String(old.end_date))) / 3_600_000;
  }
  hours = Math.min(MAX_OVERTIME_HOURS, Math.round(Math.max(0, hours) * 100) / 100);
  if (hours <= 0) return null;
  const guards = Number(old.guards_needed ?? 1) || 1;
  return {
    scheduled_duration_hours: old.duration_hours ?? null,
    scheduled_estimated_payout: old.estimated_payout ?? null,
    overtime_hours: hours,
    overtime_amount: roundMoney(hours * Number(old.hourly_rate ?? 0) * guards),
    overtime_status: 'pending_client',
  };
}

type Negotiation = { guardId?: unknown };
function negotiationList(v: unknown): Negotiation[] {
  if (Array.isArray(v)) return v as Negotiation[];
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** A guard may add or change only its own negotiation entry; everyone else's must be unchanged. */
export function guardNegotiationOk(oldValue: unknown, newValue: unknown, self: string): boolean {
  const before = negotiationList(oldValue).filter((n) => n && n.guardId !== self);
  const after = negotiationList(newValue).filter((n) => n && n.guardId !== self);
  const key = (list: Negotiation[]) => list.map((n) => JSON.stringify(n)).sort().join('\n');
  return before.length === after.length && key(before) === key(after);
}
const CLIENT_PRICING_COLS = new Set(['hourly_rate', 'guard_pay', 'estimated_payout', 'guards_needed', 'pricing_mode']);

function asList(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === 'string') {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mentions(value: unknown, id: string): boolean {
  if (value == null) return false;
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.includes(`"${id}"`) || text === id;
}

export function authorizeJobUpdate(identity: RequestIdentity, old: Row, input: Row): JobDecision {
  const self = identity.profileId;
  const patch: Row = {};
  const oldStatus = String(old.status ?? '');

  if (identity.platformRole === 'client') {
    if (old.client_id !== self) return { ok: false, error: 'Not your job' };
    const candidates = new Set([
      ...asList(old.applicants),
      ...(old.pending_guard_id ? [String(old.pending_guard_id)] : []),
      ...(old.target_guard_id ? [String(old.target_guard_id)] : []),
    ]);
    for (const [k, v] of Object.entries(input)) {
      if (k === 'status') continue;
      if (CLIENT_LOCKED_COLS.has(k)) continue;
      if (CLIENT_PRICING_COLS.has(k) && !PRE_ACCEPT.has(oldStatus)) continue;
      if (k === 'assigned_guard_id') {
        if (v === null && PRE_ACCEPT.has(oldStatus)) patch[k] = v;
        else if (typeof v === 'string' && (v === old.assigned_guard_id || candidates.has(v))) patch[k] = v;
        continue;
      }
      if (k === 'target_guard_id' && !PRE_ACCEPT.has(oldStatus)) continue;
      if (k === 'overtime_status') {
        if (v === old.overtime_status) continue;
        if (!(CLIENT_OVERTIME_MOVES[String(old.overtime_status ?? '')] ?? []).includes(String(v))) continue;
      }
      patch[k] = v;
    }
    const longer = paidShiftLengthened(old, patch);
    if (longer) return { ok: false, error: longer };
    if ('status' in input && input.status !== oldStatus) {
      const next = String(input.status);
      const assigning = typeof patch.assigned_guard_id === 'string' && candidates.has(patch.assigned_guard_id);
      const unpaid = !old.payment_status || old.payment_status === 'unpaid';
      if (next === 'closed' && CLIENT_CANCEL_FROM.has(oldStatus) && unpaid) {
        patch.status = next;
      } else if (next === 'accepted' && oldStatus === 'open' && assigning) {
        patch.status = next;
      } else {
        return { ok: false, error: 'Only staff can change this job’s status' };
      }
    }
  } else if (identity.platformRole === 'guard') {
    const assigned = old.assigned_guard_id === self;
    if (assigned) {
      for (const [k, v] of Object.entries(input)) {
        if (k === 'price_negotiations' && !guardNegotiationOk(old.price_negotiations, v, self)) continue;
        if (k !== 'status' && GUARD_ASSIGNED_COLS.has(k)) patch[k] = v;
      }
      // Guard approving overtime the system proposed to them.
      if (input.overtime_status === 'pending_client' && old.overtime_status === 'pending_guard') {
        patch.overtime_status = 'pending_client';
      }
      if ('status' in input && input.status !== oldStatus) {
        const next = String(input.status);
        const okMove =
          (oldStatus === 'accepted' && next === 'in-progress') ||
          (oldStatus === 'in-progress' && next === 'completed');
        if (!okMove) return { ok: false, error: 'Only staff can change this job’s status' };
        patch.status = next;
        if (next === 'completed') {
          const ot = serverOvertime(old, input.check_out_audit ?? old.check_out_audit);
          if (ot) Object.assign(patch, ot, { overtime_guard_approved_at: new Date().toISOString() });
        }
      }
    } else {
      // Not this guard's job: apply, decline a direct offer, negotiate, or accept a direct/replacement offer.
      const isDirectTarget = old.request_type === 'direct' && old.target_guard_id === self;
      const replacementOffer = mentions(old.replacement_request, self);
      // Replacement hand-offs only before the shift is done (never take over a completed/paid job).
      const replacementOpen = replacementOffer && ['open', 'accepted', 'in-progress'].includes(oldStatus);
      const canTake = (oldStatus === 'open' && isDirectTarget) || replacementOpen;
      if (oldStatus !== 'open' && !replacementOpen) return { ok: false, error: 'Not your job' };
      for (const [k, v] of Object.entries(input)) {
        if (k === 'applicants') {
          const before = new Set(asList(old.applicants));
          const after = new Set(asList(v));
          const added = [...after].filter((x) => !before.has(x));
          const removed = [...before].filter((x) => !after.has(x));
          if (added.every((x) => x === self) && removed.every((x) => x === self)) patch[k] = v;
        } else if (k === 'price_negotiations') {
          if (guardNegotiationOk(old.price_negotiations, v, self)) patch[k] = v;
        } else if (k === 'pending_guard_id') {
          if (v === self && (old.pending_guard_id == null || old.pending_guard_id === self)) patch[k] = v;
          else if (v === null && old.pending_guard_id === self) patch[k] = v;
        } else if ((k === 'request_type' || k === 'target_guard_id') && isDirectTarget) {
          if ((k === 'request_type' && v === 'marketplace') || (k === 'target_guard_id' && v === null)) patch[k] = v;
        } else if (k === 'assigned_guard_id' && canTake && v === self) {
          patch[k] = v;
        } else if (canTake && ['en_route_at', 'arrived_at', 'guard_live_location'].includes(k) && v === null) {
          patch[k] = v;
        } else if (k === 'replacement_request' && replacementOpen) {
          patch[k] = v;
        }
      }
      if ('status' in input && input.status !== oldStatus) {
        if (!(input.status === 'accepted' && canTake && patch.assigned_guard_id === self)) {
          return { ok: false, error: 'Only staff can change this job’s status' };
        }
        patch.status = 'accepted';
      }
    }
  } else {
    return { ok: false, error: 'Not allowed' };
  }

  if (Object.keys(patch).length === 0) return { ok: false, error: 'Not allowed to change these job fields' };
  return { ok: true, patch };
}

/** Initial status a client may give a new job (staff review unless auto-publish applies). */
export function clientInitialJobStatus(
  requested: unknown,
  opts: { trustedClient: boolean; reviewMode: string | null; trustedAutoPublish: boolean | null }
): string {
  const mode = opts.reviewMode ?? 'trusted-auto';
  if (requested === 'draft') return 'draft';
  if (requested === 'open') {
    if (mode === 'none') return 'open';
    if (mode === 'trusted-auto' && opts.trustedAutoPublish !== false && opts.trustedClient) return 'open';
  }
  return 'pending-review';
}

/**
 * Client price of a job: hours x hourly rate x guards (same formula as computeJobBilling).
 * Returns null when the row does not carry enough data to compute it.
 */
export function clientJobEstimatedPayout(row: Row): number | null {
  const hours = Number(row.duration_hours);
  const rate = Number(row.hourly_rate);
  if (!Number.isFinite(hours) || !Number.isFinite(rate) || hours <= 0 || rate <= 0) return null;
  const guards = Math.max(1, Number(row.guards_needed ?? 1) || 1);
  return Math.round(hours * rate * guards * 100) / 100;
}
