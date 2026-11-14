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
  // Non-staff only need a support display name for staff (chat and support threads).
  staff: new Set(['id', 'first_name', 'avatar']),
};

/** Hidden private string columns are returned as '' (not omitted). */
const HIDDEN_STRING_PLACEHOLDERS = ['email', 'phone'];

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
    if (table === 'staff' && 'name' in r) out.name = typeof r.first_name === 'string' && r.first_name ? r.first_name : 'Guardr Support';
    // The app maps every profile row and calls string methods on email/phone; keep the
    // keys as empty strings so hiding them never crashes a screen.
    for (const k of HIDDEN_STRING_PLACEHOLDERS) if (k in r && !(k in out)) out[k] = '';
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


// ---------------------------------------------------------------- jobs

/** Job columns any signed-in user may see on an open job they are not part of. */
export const MARKETPLACE_JOB_COLUMNS = new Set([
  'id', 'title', 'description', 'client_id', 'client_name', 'client_logo', 'client_rating', 'state',
  'type', 'armed_required', 'guards_needed', 'uniform_requirements', 'equipment_requirements',
  'start_date', 'end_date', 'duration_hours', 'hourly_rate', 'guard_pay', 'estimated_payout', 'status',
  'required_certifications', 'created_at', 'schedule_type', 'recurring_end_date', 'recurring_days',
  'assignment_mode', 'min_years_experience', 'location_risk_level', 'tier_pay_rates', 'request_type',
  'target_guard_id', 'pending_guard_id', 'min_guard_qualification', 'break_minutes', 'break_paid',
  'opened_at', 'pricing_mode', 'opening_price_offer', 'agreement_fee_config', 'job_location_id',
  'assigned_guard_id', 'applicants', 'price_negotiations', 'latitude', 'longitude', 'location',
  'address', 'platform_fee_per_hour', 'replacement_request',
]);

/** "123 Main St, Sacramento, CA 95814" -> "Sacramento, CA". */
export function approximateArea(address: unknown): string {
  if (typeof address !== 'string') return '';
  const text = address.includes(' — ') ? address.split(' — ').pop()! : address;
  const parts = text.split(',').map((p) => p.trim()).filter(Boolean);
  const kept = parts
    .filter((p, i) => !(i === 0 && parts.length > 1 && /\d/.test(p)))
    .map((p) => p.replace(/\b\d{5}(-\d{4})?\b/g, '').trim())
    .filter((p) => p && !/^(usa|united states)$/i.test(p));
  return kept.slice(-2).join(', ');
}

function mentionsId(value: unknown, id: string): boolean {
  if (value == null) return false;
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  return text.includes(`"${id}"`);
}

export interface JobViewContext {
  /** Jobs where this guard holds a team slot (full access). */
  slotJobIds: Set<string>;
}

/**
 * Full job rows only for the owner client, assigned guard, team-slot guards and staff.
 * Everyone else sees open jobs (and replacement offers made to them) with marketplace
 * fields: area instead of address, rounded coordinates, only their own applicant and
 * negotiation entries. Other jobs are dropped.
 */
export function scopeJobRows(identity: RequestIdentity, data: unknown, ctx: JobViewContext): unknown {
  if (isStaffIdentity(identity) || !Array.isArray(data)) return data;
  const self = identity.profileId;
  const out: Row[] = [];
  for (const raw of data as Row[]) {
    if (!raw || typeof raw !== 'object') continue;
    const id = String(raw.id ?? '');
    const full =
      raw.client_id === self ||
      raw.assigned_guard_id === self ||
      (identity.profileKind === 'guard' && ctx.slotJobIds.has(id));
    if (full) {
      out.push(raw);
      continue;
    }
    const replacementOffer = identity.profileKind === 'guard' && mentionsId(raw.replacement_request, self);
    if (raw.status !== 'open' && !replacementOffer) continue;
    const row: Row = {};
    for (const [k, v] of Object.entries(raw)) if (MARKETPLACE_JOB_COLUMNS.has(k)) row[k] = v;
    if ('address' in row) row.address = approximateArea(raw.address);
    if ('location' in row) row.location = approximateArea(raw.address ?? raw.location);
    for (const k of ['latitude', 'longitude']) {
      if (typeof row[k] === 'number') row[k] = Math.round((row[k] as number) * 100) / 100;
    }
    if ('applicants' in row) {
      const list = Array.isArray(raw.applicants) ? (raw.applicants as unknown[]) : [];
      row.applicants = list.filter((a) => a === self);
    }
    if ('price_negotiations' in row) {
      const list = Array.isArray(raw.price_negotiations) ? (raw.price_negotiations as Row[]) : [];
      row.price_negotiations = list.filter((n) => n && n.guardId === self);
    }
    if ('replacement_request' in row && !replacementOffer) row.replacement_request = null;
    if ('target_guard_id' in row && raw.target_guard_id !== self && raw.target_guard_id != null) row.target_guard_id = 'other';
    if ('pending_guard_id' in row && raw.pending_guard_id !== self && raw.pending_guard_id != null) row.pending_guard_id = 'other';
    out.push(row);
  }
  return out;
}

/** Job ids already on an open or completed payout invoice. */
export function invoicedJobIds(invoices: Array<{ job_ids?: unknown; status?: unknown }>): Set<string> {
  const ids = new Set<string>();
  for (const inv of invoices) {
    if (inv.status === 'cancelled') continue;
    let list = inv.job_ids;
    if (typeof list === 'string') {
      try {
        list = JSON.parse(list);
      } catch {
        list = [];
      }
    }
    if (Array.isArray(list)) for (const j of list) ids.add(String(j));
  }
  return ids;
}

// ---------------------------------------------------------------- shared tables

/** Location columns only the owning client (and staff) may read: door codes, alarm notes. */
const PRIVATE_LOCATION_COLS = ['site_instructions', 'access_instructions', 'parking_instructions', 'notes', 'reviewed_by'];
/** Credential columns only the guard (and staff) may read: document scans and review notes. */
const PRIVATE_CERT_COLS = ['image_url', 'pending_update', 'revision_history', 'rejection_reason', 'update_request_note'];

/** Vehicle columns only the guard, staff, and people on the guard's active job may read. */
const PRIVATE_VEHICLE_STRING_COLS = ['plate_number', 'plate_state'];
const PRIVATE_VEHICLE_COLS = [
  'front_photo_url', 'left_side_photo_url', 'right_side_photo_url', 'back_photo_url',
  'vehicle_insurance_policy_id', 'rejection_reason', 'reviewed_by',
];

/** Owner column and private columns per shared table (used to stop filter probing). */
const SHARED_PRIVATE: Record<string, { owner: string; cols: string[] }> = {
  job_locations: { owner: 'created_by_client_id', cols: PRIVATE_LOCATION_COLS },
  certifications: { owner: 'guard_id', cols: PRIVATE_CERT_COLS },
  guard_vehicle_profiles: { owner: 'guard_id', cols: [...PRIVATE_VEHICLE_STRING_COLS, ...PRIVATE_VEHICLE_COLS] },
};

/**
 * Filtering a shared table on a private column would reveal it (does plate X exist?).
 * Such reads only match the caller's own rows: returns the owner OR-group, or null.
 */
export function privateFilterOwnerOr(table: string, identity: RequestIdentity, filterCols: string[]): string | null {
  const spec = SHARED_PRIVATE[table];
  if (!spec || isStaffIdentity(identity)) return null;
  return filterCols.some((c) => spec.cols.includes(c)) ? `${spec.owner}.eq.${identity.profileId}` : null;
}

export interface SharedReadContext {
  /** Job chat threads the caller belongs to. */
  threadIds?: Set<string>;
  /** Support tickets the caller opened. */
  ticketIds?: Set<string>;
  /** Guards the caller works with on an active job (their client, or crew mates). */
  vehicleGuardIds?: Set<string>;
}

/**
 * Row filtering for tables every signed-in user may query but should only partly see.
 * Staff are not limited here.
 */
export function scopeSharedRows(table: string, identity: RequestIdentity, data: unknown, ctx: SharedReadContext = {}): unknown {
  if (isStaffIdentity(identity) || !Array.isArray(data)) return data;
  const self = identity.profileId;
  const list = data as Row[];
  switch (table) {
    case 'job_chat_messages':
      return list.filter((r) => ctx.threadIds?.has(String(r.thread_id ?? '')));
    case 'support_messages':
      return list.filter((r) => ctx.ticketIds?.has(String(r.ticket_id ?? '')));
    case 'guard_messages':
      return identity.profileKind === 'guard' ? list : [];
    case 'client_messages':
      return identity.profileKind === 'client' ? list : [];
    case 'job_locations':
      return list.map((r) => {
        if (r.created_by_client_id === self) return r;
        const out = { ...r };
        for (const k of PRIVATE_LOCATION_COLS) if (k in out) out[k] = null;
        return out;
      });
    case 'guard_vehicle_profiles':
      return list.map((r) => {
        const owner = String(r.guard_id ?? '');
        if (owner === self || ctx.vehicleGuardIds?.has(owner)) return r;
        const out = { ...r };
        for (const k of PRIVATE_VEHICLE_STRING_COLS) if (k in out) out[k] = '';
        for (const k of PRIVATE_VEHICLE_COLS) if (k in out) out[k] = null;
        return out;
      });
    case 'certifications':
      return list.map((r) => {
        if (r.guard_id === self) return r;
        const out = { ...r };
        for (const k of PRIVATE_CERT_COLS) if (k in out) out[k] = null;
        return out;
      });
    default:
      return data;
  }
}

/** Tables whose rows need membership lookups before scopeSharedRows. */
export const MEMBERSHIP_SCOPED_TABLES = new Set(['job_chat_messages', 'support_messages']);
