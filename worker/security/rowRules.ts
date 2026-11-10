/**
 * Extra per-table rules for /api/data/query that need the stored row:
 * public profile columns, append-only audit log, and server-computed payout invoices.
 */
import type { RequestIdentity } from '../../lib/auth/requestIdentity.ts';
import { computeGuardEarnings } from '../../lib/platformFees.ts';

type Row = Record<string, unknown>;

/** Columns anyone signed in may see on someone else's profile. Owners and staff see everything. */
export const PUBLIC_PROFILE_COLUMNS: Record<string, Set<string>> = {
  guards: new Set([
    'id', 'name', 'first_name', 'middle_name', 'last_name', 'badge_number', 'avatar', 'bio',
    'is_armed', 'background_checked', 'verified', 'rating', 'jobs_completed', 'hourly_rate_requirement',
    'is_staff', 'staff_role', 'user_status', 'created_at', 'headline', 'summary', 'about', 'skills',
    'languages', 'service_areas', 'specialties', 'years_experience', 'availability_notes',
    'armed_preference', 'guard_card_status', 'has_reliable_transportation', 'listed_weapon_gear',
    'listed_equipment_gear', 'inventory_equipment', 'inventory_uniforms', 'job_type_preferences',
    'id_verification_status', 'credential_expiry_restricted', 'trusted',
  ]),
  clients: new Set([
    'id', 'name', 'first_name', 'middle_name', 'last_name', 'company_name', 'avatar', 'created_at',
    'approved', 'rating', 'trusted', 'client_type', 'business_type', 'industries', 'website',
    'service_city', 'service_state', 'total_requests', 'account_status',
  ]),
  staff: new Set([
    'id', 'name', 'first_name', 'middle_name', 'last_name', 'badge_number', 'avatar', 'bio',
    'staff_role', 'user_status', 'headline', 'summary', 'about', 'specialties', 'managed_cities',
  ]),
};

export function isStaffIdentity(identity: RequestIdentity): boolean {
  return identity.profileKind === 'staff';
}

/** Strip private columns from other people's profile rows for non-staff callers. */
export function scopeProfileRows(table: string, identity: RequestIdentity, data: unknown): unknown {
  const allowed = PUBLIC_PROFILE_COLUMNS[table];
  if (!allowed || isStaffIdentity(identity)) return data;
  const scope = (row: unknown) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return row;
    const r = row as Row;
    if (table !== 'staff' && r.id === identity.profileId) return r;
    const out: Row = {};
    for (const [k, v] of Object.entries(r)) if (allowed.has(k)) out[k] = v;
    return out;
  };
  return Array.isArray(data) ? data.map(scope) : scope(data);
}

/** Filtering another person's profile on a private column would leak it; only allow it on your own row. */
export function needsSelfOnlyFilter(table: string, identity: RequestIdentity, filterCols: string[]): boolean {
  const allowed = PUBLIC_PROFILE_COLUMNS[table];
  if (!allowed || isStaffIdentity(identity)) return false;
  if (table === 'staff') return filterCols.some((c) => !allowed.has(c));
  return filterCols.some((c) => !allowed.has(c));
}

/** Audit rows are written with the caller's real identity; the actor fields cannot be chosen. */
export function stampAuditRows(identity: RequestIdentity, rows: Row[]): Row[] {
  return rows.map((row) => ({
    ...row,
    actor_id: identity.profileId,
    actor_email: identity.email,
    actor_role: identity.staffRole ?? identity.platformRole,
    created_at: new Date().toISOString(),
  }));
}

export interface JobForInvoice {
  id: string;
  title: string | null;
  client_name: string | null;
  assigned_guard_id: string | null;
  status: string | null;
  payment_status: string | null;
  guard_payout_method: string | null;
  guard_payout_available: boolean | null;
  duration_hours: number | string | null;
  hourly_rate: number | string | null;
  start_date: string | null;
  end_date: string | null;
}

/** Build a guard's payout invoice from the stored jobs; the client's lines and total are ignored. */
export function buildServerInvoice(
  identity: RequestIdentity,
  requested: Row,
  jobs: JobForInvoice[]
): { ok: true; row: Row } | { ok: false; error: string } {
  const wanted = Array.isArray(requested.job_ids) ? requested.job_ids.map(String) : [];
  if (!wanted.length) return { ok: false, error: 'Pick at least one job' };
  const byId = new Map(jobs.map((j) => [j.id, j]));
  const lines = [] as Row[];
  for (const id of new Set(wanted)) {
    const job = byId.get(id);
    const eligible =
      job &&
      job.assigned_guard_id === identity.profileId &&
      job.status === 'completed' &&
      ['paid', 'held'].includes(job.payment_status ?? '') &&
      job.guard_payout_method !== 'cash' &&
      job.guard_payout_available === true;
    if (!eligible) return { ok: false, error: 'One or more jobs are not ready for payout' };
    lines.push({
      jobId: job.id,
      title: job.title ?? '',
      clientName: job.client_name ?? '',
      amount: computeGuardEarnings(Number(job.duration_hours ?? 0), Number(job.hourly_rate ?? 0)),
      schedule: [job.start_date, job.end_date].filter(Boolean).join(' – '),
    });
  }
  const total = Math.round(lines.reduce((s, l) => s + Number(l.amount), 0) * 100) / 100;
  const row: Row = {
    guard_id: identity.profileId,
    guard_name: typeof requested.guard_name === 'string' ? requested.guard_name.slice(0, 200) : null,
    guard_email: identity.email,
    method: 'stripe',
    job_ids: lines.map((l) => l.jobId),
    lines,
    total,
    status: 'open',
    created_at: new Date().toISOString(),
    resolved_at: null,
  };
  if (typeof requested.id === 'string' && /^[A-Za-z0-9_.:-]{1,128}$/.test(requested.id)) row.id = requested.id;
  return { ok: true, row };
}
