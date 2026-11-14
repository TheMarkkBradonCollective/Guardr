import type { Hono } from 'hono';
import type { WorkerEnv } from '../app.ts';
import { createNeonDatabase } from '../../lib/db/neonServerless.ts';
import { currentRequestIdentity } from '../../lib/auth/requestIdentity.ts';
import {
  ALLOWED_TABLES,
  TABLE_POLICIES,
  ownerColumns,
  planQuery,
  redactRows,
  type Filter,
  type Operation,
} from '../security/dataPolicy.ts';
import { authorizeJobUpdate, clientInitialJobStatus, clientJobEstimatedPayout } from '../security/jobPolicy.ts';
import { staffWriteDenial, staffRank } from '../security/staffRules.ts';
import { hashPassword } from '../../src/lib/auth/passwordHash.ts';
import { EMAIL_RE } from '../security/signupProfile.ts';
import {
  buildServerInvoice,
  invoicedJobIds,
  MARKETPLACE_JOB_COLUMNS,
  needsSelfOnlyFilter,
  privateFilterOwnerOr,
  scopeJobRows,
  scopeProfileRows,
  scopeSharedRows,
  stampAuditRows,
  type JobForInvoice,
} from '../security/rowRules.ts';

type QueryBody = {
  table?: string;
  operation?: Operation;
  columns?: string;
  payload?: Record<string, unknown> | Record<string, unknown>[];
  filters?: Filter[];
  upsertConflict?: string;
};

export { ALLOWED_TABLES };

/** Non-staff reads of these tables are scoped on whole rows, then projected to the asked columns. */
const SCOPED_PROJECT_TABLES = new Set(['job_chat_messages', 'support_messages', 'job_locations', 'certifications', 'guard_vehicle_profiles']);
/** Tables whose staff-created rows get a login (users row) when the app sends a provisioned password. */
const PROVISION_LOGIN_TABLES: Record<string, 'guard' | 'client' | 'staff'> = { guards: 'guard', clients: 'client', staff: 'staff' };

function projectRows(data: unknown, cols: string[] | null): unknown {
  if (!cols || !Array.isArray(data)) return data;
  return (data as Record<string, unknown>[]).map((r) => Object.fromEntries(cols.filter((k) => k in r).map((k) => [k, r[k]])));
}

function parseColumnList(columns: string | undefined): string[] | null {
  if (!columns || columns.trim() === '*') return null;
  const cols = columns.split(',').map((c) => c.trim());
  return cols.every((c) => /^[a-z_][a-z0-9_]*$/.test(c)) ? cols : null;
}

/** Constraint / bad-value errors are the caller's fault: answer 400, not 500. */
export function isDataError(err: { message?: string; code?: unknown }): boolean {
  const code = String(err.code ?? '');
  if (code.startsWith('23') || code.startsWith('22')) return true;
  return /violates|invalid input|null value in column|duplicate key|out of range|malformed|invalid .*syntax/i.test(err.message ?? '');
}

export function registerWorkerDataRoutes(app: Hono<{ Bindings: WorkerEnv }>) {
  app.post('/api/data/query', async (c) => {
    // Identity comes only from the verified JWT (the x-guardr-session header is ignored).
    const identity = currentRequestIdentity();
    if (!identity) return c.json({ data: null, error: { message: 'Unauthorized' } }, 401);

    const body = (await c.req.json<QueryBody>().catch(() => ({}))) as QueryBody;
    const table = typeof body.table === 'string' ? body.table : '';
    const operation = (body.operation ?? 'select') as Operation;
    const filters = Array.isArray(body.filters) ? body.filters : [];
    for (const f of filters) {
      if (!f || typeof f.col !== 'string' || !['eq', 'neq', 'in'].includes(f.op)) {
        return c.json({ data: null, error: { message: 'Invalid filter' } }, 400);
      }
    }

    const staff = identity.profileKind === 'staff';
    const deny = (message: string, status: 403 | 400 = 403) => c.json({ data: null, error: { message } }, status);

    // Append-only audit trail: insert and read only, for everyone.
    if (table === 'audit_log' && operation !== 'insert' && operation !== 'select') return deny('Audit log is append-only');
    if (!staff && table === 'guard_payout_invoices' && (operation === 'update' || operation === 'delete')) {
      return deny('Only staff can change a payout invoice');
    }
    if (!staff && table === 'security_requests') {
      if (operation === 'upsert' || operation === 'delete') return deny('Not allowed');
      if (operation === 'insert' && identity.profileKind !== 'client') return deny('Only clients can post jobs');
      if (operation === 'update' && !filters.some((f) => f.col === 'id' && f.op === 'eq')) {
        return deny('Update a job by its id', 400);
      }
    }

    if (table === 'audit_log' && operation === 'insert' && body.payload) {
      const rows = Array.isArray(body.payload) ? body.payload : [body.payload];
      const stamped = stampAuditRows(identity, rows as Record<string, unknown>[]);
      body.payload = Array.isArray(body.payload) ? stamped : stamped[0];
    }

    // Staff creating a guard/client/staff account send the provisioned password; planQuery strips
    // it from the row, so remember it here and create the login (hash only) after the insert.
    const provisions: Array<{ id: string; email: string; password: string; mustChange: boolean }> = [];
    if (staff && operation === 'insert' && PROVISION_LOGIN_TABLES[table] && body.payload) {
      const rows = (Array.isArray(body.payload) ? body.payload : [body.payload]) as Record<string, unknown>[];
      for (const r of rows) {
        if (r && typeof r.password === 'string' && r.password.length >= 8 && typeof r.id === 'string' && typeof r.email === 'string') {
          provisions.push({ id: r.id, email: r.email.trim().toLowerCase(), password: r.password, mustChange: r.must_change_password !== false });
        }
      }
    }

    // Keep the caller's original payload for the job-transition check (planQuery strips some columns).
    const plan = planQuery(identity, table, operation, filters, body.payload, body.upsertConflict);
    if (plan.ok === false) return c.json({ data: null, error: { message: plan.error } }, plan.status);
    if (plan.noop) {
      if (!staff && table === 'security_requests' && operation === 'update') return deny('Not allowed to change these job fields');
      return c.json({ data: [], error: null });
    }

    const db = createNeonDatabase(c.env.DATABASE_URL, { numericAsNumber: true });
    const failed = (err?: { message?: string; code?: unknown } | null) => {
      if (err) console.warn('data query failed', table, operation, err.code, err.message);
      if (err && isDataError(err)) return c.json({ data: null, error: { message: 'Invalid or duplicate data' } }, 400);
      if (err) console.error('data query failed', table, operation, err.code, err.message);
      return c.json({ data: null, error: { message: 'Query failed' } }, 500);
    };

    if (operation === 'select' && needsSelfOnlyFilter(table, identity, filters.map((f) => f.col))) {
      plan.ownerOr = `id.eq.${identity.profileId}`;
    }
    // Shared tables: filtering on a private column (plate, gate code, scan) only matches your own rows.
    if (operation === 'select') {
      const own = privateFilterOwnerOr(table, identity, filters.map((f) => f.col));
      if (own) plan.ownerOr = own;
    }
    // Jobs: filtering on a private column only matches your own jobs.
    const jobRead = !staff && table === 'security_requests' && operation === 'select';
    if (jobRead && filters.some((f) => !MARKETPLACE_JOB_COLUMNS.has(f.col))) {
      plan.ownerOr = `client_id.eq.${identity.profileId},assigned_guard_id.eq.${identity.profileId}`;
    }
    // Scoping needs the ownership columns, so read whole rows and project afterwards.
    let projectCols: string[] | null = null;
    const sharedRead = !staff && operation === 'select' && SCOPED_PROJECT_TABLES.has(table);
    if ((jobRead || sharedRead) && body.columns && body.columns.trim() !== '*') {
      const cols = parseColumnList(body.columns);
      if (!cols) return deny('Invalid column', 400);
      projectCols = cols;
      body.columns = '*';
    }

    // Job chat and support messages: only members of the thread / owner of the ticket.
    if (!staff && operation !== 'select' && operation !== 'delete' && (table === 'job_chat_messages' || table === 'support_messages')) {
      const rows = (Array.isArray(plan.payload) ? plan.payload : [plan.payload ?? {}]) as Record<string, unknown>[];
      const key = table === 'job_chat_messages' ? 'thread_id' : 'ticket_id';
      const ids = [...new Set(rows.map((r) => String(r[key] ?? '')))];
      const allowed = table === 'job_chat_messages' ? await myThreadIds(db, identity.profileId) : await myTicketIds(db, identity.profileId);
      if (allowed === null) return failed();
      if (ids.some((id) => !allowed.has(id))) return deny('Not allowed');
    }

    // Staff: each tier may only make the changes its role allows (see staffRules.ts).
    if (staff && operation !== 'select') {
      const rows = (operation === 'delete' ? [] : Array.isArray(plan.payload) ? plan.payload : [plan.payload ?? {}]) as Record<string, unknown>[];
      let existing: Record<string, unknown>[] | null = null;
      if (operation === 'update' || operation === 'upsert') {
        let probe = db.from(table).select('*');
        if (operation === 'update') {
          for (const f of filters) {
            if (f.op === 'eq') probe = probe.eq(f.col, f.val);
            else if (f.op === 'neq') probe = probe.neq(f.col, f.val);
            else if (f.op === 'in') probe = probe.in(f.col, Array.isArray(f.vals) ? f.vals : []);
          }
        } else {
          const conflict = (body.upsertConflict ?? 'id').split(',')[0].trim();
          probe = probe.in(conflict, rows.map((r) => r[conflict]).filter((v) => v != null));
        }
        const found = await probe;
        if (found.error) return failed(found.error);
        existing = (found.data ?? []) as Record<string, unknown>[];
      }
      const denial = staffWriteDenial(identity, table, operation, rows, existing);
      if (denial) return deny(denial);
    }

    // Guards' payout invoices: lines and total come from the stored jobs, never from the app.
    if (!staff && table === 'guard_payout_invoices' && (operation === 'insert' || operation === 'upsert')) {
      const rows = Array.isArray(plan.payload) ? plan.payload : [plan.payload ?? {}];
      if (rows.length !== 1) return deny('One invoice at a time', 400);
      const requested = rows[0] as Record<string, unknown>;
      if (typeof requested.id === 'string') {
        const existing = await db.from('guard_payout_invoices').select('*').eq('id', requested.id);
        if (existing.error) return failed(existing.error);
        const found = (existing.data ?? []) as Record<string, unknown>[];
        if (found.length) {
          if (found[0].guard_id !== identity.profileId) return deny('Not allowed');
          return c.json({ data: found, error: null });
        }
      }
      const jobIds = Array.isArray(requested.job_ids) ? requested.job_ids.map(String).slice(0, 200) : [];
      const jobs = jobIds.length
        ? await db
            .from('security_requests')
            .select('id, title, client_name, assigned_guard_id, status, payment_status, guard_payout_method, guard_payout_available, duration_hours, hourly_rate, start_date, end_date')
            .in('id', jobIds)
        : { data: [], error: null };
      if (jobs.error) return failed(jobs.error);
      const me = await db.from('guards').select('name').eq('id', identity.profileId);
      const myName = ((me.data ?? [])[0] as Record<string, unknown> | undefined)?.name;
      requested.guard_name = typeof myName === 'string' && myName ? myName : identity.email;
      const built = buildServerInvoice(identity, requested, (jobs.data ?? []) as unknown as JobForInvoice[]);
      if (built.ok === false) return deny(built.error, 400);
      // One active invoice per job.
      const mine = await db.from('guard_payout_invoices').select('job_ids, status').eq('guard_id', identity.profileId);
      if (mine.error) return failed(mine.error);
      const already = invoicedJobIds((mine.data ?? []) as Array<{ job_ids?: unknown; status?: unknown }>);
      if ((built.row.job_ids as string[]).some((j) => already.has(j))) {
        return c.json({ data: null, error: { message: 'A payout invoice already exists for one of these jobs' } }, 409);
      }
      const ins = await db.from('guard_payout_invoices').insert(built.row).select('*');
      if (ins.error) return failed(ins.error);
      return c.json({ data: ins.data, error: null });
    }

    // Clients and guards: job writes follow the job's status rules.
    if (!staff && table === 'security_requests' && operation === 'insert') {
      const rows = (Array.isArray(plan.payload) ? plan.payload : [plan.payload ?? {}]) as Record<string, unknown>[];
      const [client, settings] = await Promise.all([
        db.from('clients').select('trusted').eq('id', identity.profileId),
        db.from('platform_settings').select('job_review_mode, trusted_client_auto_publish'),
      ]);
      if (client.error || settings.error) return failed(client.error ?? settings.error);
      const cl = ((client.data ?? [])[0] ?? {}) as Record<string, unknown>;
      const st = ((settings.data ?? [])[0] ?? {}) as Record<string, unknown>;
      for (const row of rows) {
        row.status = clientInitialJobStatus(row.status, {
          trustedClient: cl.trusted === true,
          reviewMode: (st.job_review_mode as string | null) ?? null,
          trustedAutoPublish: (st.trusted_client_auto_publish as boolean | null) ?? null,
        });
        if (row.status !== 'open') row.opened_at = null;
        row.assigned_guard_id = null;
        row.pending_guard_id = null;
        row.applicants = [];
        const price = clientJobEstimatedPayout(row);
        if (price !== null) row.estimated_payout = price;
      }
      plan.payload = Array.isArray(plan.payload) ? rows : rows[0];
    }
    if (!staff && table === 'security_requests' && operation === 'update') {
      const id = filters.find((f) => f.col === 'id' && f.op === 'eq') as { val?: unknown };
      const current = await db.from('security_requests').select('*').eq('id', id.val);
      if (current.error) return failed(current.error);
      const old = ((current.data ?? [])[0] ?? null) as Record<string, unknown> | null;
      if (!old) return c.json({ data: [], error: null });
      const decision = authorizeJobUpdate(identity, old, (plan.payload ?? {}) as Record<string, unknown>);
      if (decision.ok === false) return deny(decision.error);
      plan.payload = decision.patch;
      if (['hourly_rate', 'duration_hours', 'guards_needed', 'estimated_payout'].some((k) => k in decision.patch)) {
        const price = clientJobEstimatedPayout({ ...old, ...decision.patch });
        if (price !== null && identity.platformRole === 'client') decision.patch.estimated_payout = price;
      }
      plan.ownerOr = null; // authorizeJobUpdate already checked this row
    }

    if (plan.upsertCheck) {
      const policy = TABLE_POLICIES[table];
      const cols = ownerColumns(policy, identity);
      const existing = await db
        .from(table)
        .select([plan.upsertCheck.col, ...cols].join(', '))
        .in(plan.upsertCheck.col, plan.upsertCheck.vals);
      if (existing.error) {
        return failed();
      }
      const foreign = (existing.data ?? []).some(
        (row) => !cols.some((col) => (row as Record<string, unknown>)[col] === identity.profileId)
      );
      if (foreign) return c.json({ data: null, error: { message: 'Not allowed' } }, 403);
    }

    // The Founder's own staff row can only be changed by the Founder.
    if (table === 'staff' && operation !== 'select' && operation !== 'insert' && identity.staffRole !== 'Founder') {
      let probe = db.from('staff').select('id').eq('staff_role', 'Founder');
      if (operation === 'upsert') {
        const rows = Array.isArray(plan.payload) ? plan.payload : plan.payload ? [plan.payload] : [];
        probe = probe.in('id', rows.map((r) => r.id).filter((v) => v != null));
      } else {
        for (const f of filters) {
          if (f.op === 'eq') probe = probe.eq(f.col, f.val);
          else if (f.op === 'neq') probe = probe.neq(f.col, f.val);
          else if (f.op === 'in') probe = probe.in(f.col, Array.isArray(f.vals) ? f.vals : []);
        }
      }
      const hit = await probe;
      if (hit.error || (hit.data ?? []).length > 0) {
        return c.json({ data: null, error: { message: 'Only the Founder can change the Founder account' } }, 403);
      }
    }

    let builder =
      operation === 'select'
        ? db.from(table).select(body.columns ?? '*')
        : operation === 'insert'
          ? db.from(table).insert(plan.payload ?? {})
          : operation === 'update'
            ? db.from(table).update((plan.payload ?? {}) as Record<string, unknown>)
            : operation === 'upsert'
              ? db.from(table).upsert(plan.payload ?? {}, { onConflict: body.upsertConflict })
              : db.from(table).delete();

    for (const f of filters) {
      if (f.op === 'eq') builder = builder.eq(f.col, f.val);
      else if (f.op === 'neq') builder = builder.neq(f.col, f.val);
      else if (f.op === 'in') builder = builder.in(f.col, Array.isArray(f.vals) ? f.vals : []);
    }
    if (plan.ownerOr) builder = builder.or(plan.ownerOr);

    const result = await builder;
    if (result.error) {
      const code = String(result.error.code ?? '');
      if (result.error.message?.startsWith('Invalid identifier') || code === '42703' || code === '42P01') {
        return c.json({ data: null, error: { message: 'Invalid column', code: '42703' } }, 400);
      }
      if (isDataError(result.error)) {
        // Constraint or data-format problem: say so without echoing database internals.
        return c.json({ data: null, error: { message: 'Invalid or duplicate data', code } }, 400);
      }
      console.error('data query failed', table, operation, code, result.error.message);
      return c.json({ data: null, error: { message: 'Query failed' } }, 500);
    }
    if (provisions.length && staffRank(identity) >= 3) {
      await provisionLogins(db, PROVISION_LOGIN_TABLES[table], table, provisions);
    }
    let data = scopeProfileRows(table, identity, redactRows(result.data));
    if (sharedRead) {
      const ctx = {
        threadIds: table === 'job_chat_messages' ? (await myThreadIds(db, identity.profileId)) ?? new Set<string>() : undefined,
        ticketIds: table === 'support_messages' ? (await myTicketIds(db, identity.profileId)) ?? new Set<string>() : undefined,
        vehicleGuardIds: table === 'guard_vehicle_profiles' ? await myJobPartnerGuardIds(db, identity) : undefined,
      };
      data = projectRows(scopeSharedRows(table, identity, data, ctx), projectCols);
    } else if (!staff && operation === 'select') {
      data = scopeSharedRows(table, identity, data);
    }
    if (!staff && table === 'security_requests') {
      const slots = identity.profileKind === 'guard'
        ? await db.from('job_guard_slots').select('job_id, status').eq('guard_id', identity.profileId)
        : { data: [], error: null };
      const slotJobIds = new Set(
        ((slots.data ?? []) as Record<string, unknown>[])
          .filter((r) => !['declined', 'removed', 'expired', 'cancelled'].includes(String(r.status ?? '')))
          .map((r) => String(r.job_id))
      );
      data = scopeJobRows(identity, data, { slotJobIds });
      data = projectRows(data, projectCols);
    }
    return c.json({ ...result, data });
  });
}

type Db = ReturnType<typeof createNeonDatabase>;

async function myThreadIds(db: Db, profileId: string): Promise<Set<string> | null> {
  const res = await db.from('job_chat_threads').select('id').or(`client_id.eq.${profileId},guard_id.eq.${profileId}`);
  if (res.error) return null;
  return new Set(((res.data ?? []) as Record<string, unknown>[]).map((r) => String(r.id)));
}

/** Job statuses where the client and crew need to recognise the guard's vehicle. */
const ACTIVE_JOB_STATUSES = ['accepted', 'in-progress', 'in_progress'];
const INACTIVE_SLOT_STATUSES = new Set(['declined', 'removed', 'expired', 'cancelled']);

/** Guards whose vehicle the caller may see: guards on the caller's active jobs (as client or crew mate). */
async function myJobPartnerGuardIds(db: Db, identity: { profileId: string; profileKind: string }): Promise<Set<string>> {
  const out = new Set<string>();
  const self = identity.profileId;
  let jobIds: string[] = [];
  const jobs =
    identity.profileKind === 'client'
      ? await db.from('security_requests').select('id, assigned_guard_id, status').eq('client_id', self).in('status', ACTIVE_JOB_STATUSES)
      : await db.from('security_requests').select('id, assigned_guard_id, status').eq('assigned_guard_id', self).in('status', ACTIVE_JOB_STATUSES);
  for (const r of ((jobs.data ?? []) as Record<string, unknown>[])) {
    jobIds.push(String(r.id));
    if (r.assigned_guard_id) out.add(String(r.assigned_guard_id));
  }
  if (identity.profileKind === 'guard') {
    const mine = await db.from('job_guard_slots').select('job_id, status').eq('guard_id', self);
    const slotJobs = ((mine.data ?? []) as Record<string, unknown>[])
      .filter((r) => !INACTIVE_SLOT_STATUSES.has(String(r.status ?? '')))
      .map((r) => String(r.job_id));
    if (slotJobs.length) {
      const active = await db.from('security_requests').select('id, assigned_guard_id').in('id', slotJobs).in('status', ACTIVE_JOB_STATUSES);
      for (const r of ((active.data ?? []) as Record<string, unknown>[])) {
        jobIds.push(String(r.id));
        if (r.assigned_guard_id) out.add(String(r.assigned_guard_id));
      }
    }
  }
  jobIds = [...new Set(jobIds)];
  if (jobIds.length) {
    const crew = await db.from('job_guard_slots').select('guard_id, status').in('job_id', jobIds);
    for (const r of ((crew.data ?? []) as Record<string, unknown>[])) {
      if (!INACTIVE_SLOT_STATUSES.has(String(r.status ?? '')) && r.guard_id) out.add(String(r.guard_id));
    }
  }
  out.delete(self);
  return out;
}

async function myTicketIds(db: Db, profileId: string): Promise<Set<string> | null> {
  const res = await db.from('support_tickets').select('id').eq('user_id', profileId);
  if (res.error) return null;
  return new Set(((res.data ?? []) as Record<string, unknown>[]).map((r) => String(r.id)));
}

/**
 * Create the login for accounts staff just created (the app's "default password" flow).
 * Only a PBKDF2 hash is stored; an existing login for the email is never replaced.
 */
async function provisionLogins(
  db: Db,
  kind: 'guard' | 'client' | 'staff',
  table: string,
  provisions: Array<{ id: string; email: string; password: string; mustChange: boolean }>
): Promise<void> {
  for (const p of provisions) {
    if (!EMAIL_RE.test(p.email)) continue;
    try {
      const created = await db.from(table).select('id, email').eq('id', p.id).maybeSingle();
      const row = created.data as Record<string, unknown> | null;
      if (!row || String(row.email ?? '').trim().toLowerCase() !== p.email) continue;
      const taken = await db.from('users').select('id').eq('email', p.email).maybeSingle();
      if (taken.error || taken.data) continue;
      const passwordHash = await hashPassword(p.password);
      const ins = await db.from('users').insert({ email: p.email, password_hash: passwordHash, profile_kind: kind, profile_id: p.id });
      if (ins.error) {
        console.warn('provision login failed', table, ins.error.code);
        continue;
      }
      await db.from(table).update({ password_hash: passwordHash, password: null, must_change_password: p.mustChange }).eq('id', p.id);
    } catch (err) {
      console.warn('provision login failed', table, err instanceof Error ? err.message : err);
    }
  }
}
