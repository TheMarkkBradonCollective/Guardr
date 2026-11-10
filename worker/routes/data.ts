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
import { authorizeJobUpdate, clientInitialJobStatus } from '../security/jobPolicy.ts';
import {
  buildServerInvoice,
  needsSelfOnlyFilter,
  scopeProfileRows,
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

    // Keep the caller's original payload for the job-transition check (planQuery strips some columns).
    const plan = planQuery(identity, table, operation, filters, body.payload, body.upsertConflict);
    if (plan.ok === false) return c.json({ data: null, error: { message: plan.error } }, plan.status);
    if (plan.noop) {
      if (!staff && table === 'security_requests' && operation === 'update') return deny('Not allowed to change these job fields');
      return c.json({ data: [], error: null });
    }

    const db = createNeonDatabase(c.env.DATABASE_URL);
    const failed = (err?: { message?: string; code?: unknown } | null) => {
      if (err) console.error('data query failed', table, operation, err.code, err.message);
      return c.json({ data: null, error: { message: 'Query failed' } }, 500);
    };

    if (operation === 'select' && needsSelfOnlyFilter(table, identity, filters.map((f) => f.col))) {
      plan.ownerOr = `id.eq.${identity.profileId}`;
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
      const built = buildServerInvoice(identity, requested, (jobs.data ?? []) as unknown as JobForInvoice[]);
      if (built.ok === false) return deny(built.error, 400);
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
      if (code.startsWith('23') || code.startsWith('22')) {
        // Constraint or data-format problem: say so without echoing database internals.
        return c.json({ data: null, error: { message: 'Invalid or duplicate data', code } }, 400);
      }
      console.error('data query failed', table, operation, code, result.error.message);
      return c.json({ data: null, error: { message: 'Query failed' } }, 500);
    }
    return c.json({ ...result, data: scopeProfileRows(table, identity, redactRows(result.data)) });
  });
}
