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
  'overtime_status', 'overtime_hours', 'overtime_amount', 'scheduled_duration_hours',
  'scheduled_estimated_payout', 'early_clock_out_actual_hours', 'replacement_request',
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
  'applicants', 'pending_guard_id', 'location_risk_level', 'trusted',
]);
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
      patch[k] = v;
    }
    if ('status' in input && input.status !== oldStatus) {
      const next = String(input.status);
      const assigning = typeof patch.assigned_guard_id === 'string' && candidates.has(patch.assigned_guard_id);
      if (next === 'closed' && oldStatus !== 'completed' && oldStatus !== 'in-progress') {
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
        if (k !== 'status' && GUARD_ASSIGNED_COLS.has(k)) patch[k] = v;
      }
      if ('status' in input && input.status !== oldStatus) {
        const next = String(input.status);
        const okMove =
          (oldStatus === 'accepted' && next === 'in-progress') ||
          (oldStatus === 'in-progress' && next === 'completed');
        if (!okMove) return { ok: false, error: 'Only staff can change this job’s status' };
        patch.status = next;
      }
    } else {
      // Not this guard's job: apply, decline a direct offer, negotiate, or accept a direct/replacement offer.
      const isDirectTarget = old.request_type === 'direct' && old.target_guard_id === self;
      const replacementOffer = mentions(old.replacement_request, self);
      const canTake = (oldStatus === 'open' && isDirectTarget) || replacementOffer;
      if (oldStatus !== 'open' && !replacementOffer) return { ok: false, error: 'Not your job' };
      for (const [k, v] of Object.entries(input)) {
        if (k === 'applicants') {
          const before = new Set(asList(old.applicants));
          const after = new Set(asList(v));
          const added = [...after].filter((x) => !before.has(x));
          const removed = [...before].filter((x) => !after.has(x));
          if (added.every((x) => x === self) && removed.every((x) => x === self)) patch[k] = v;
        } else if (k === 'price_negotiations') {
          patch[k] = v;
        } else if (k === 'pending_guard_id') {
          if (v === self && (old.pending_guard_id == null || old.pending_guard_id === self)) patch[k] = v;
          else if (v === null && old.pending_guard_id === self) patch[k] = v;
        } else if ((k === 'request_type' || k === 'target_guard_id') && isDirectTarget) {
          if ((k === 'request_type' && v === 'marketplace') || (k === 'target_guard_id' && v === null)) patch[k] = v;
        } else if (k === 'assigned_guard_id' && canTake && v === self) {
          patch[k] = v;
        } else if (canTake && ['en_route_at', 'arrived_at', 'guard_live_location'].includes(k) && v === null) {
          patch[k] = v;
        } else if (k === 'replacement_request' && replacementOffer) {
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
