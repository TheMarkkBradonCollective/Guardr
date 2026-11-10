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

    const plan = planQuery(identity, table, operation, filters, body.payload, body.upsertConflict);
    if (plan.ok === false) return c.json({ data: null, error: { message: plan.error } }, plan.status);
    if (plan.noop) return c.json({ data: [], error: null });

    const db = createNeonDatabase(c.env.DATABASE_URL);

    if (plan.upsertCheck) {
      const policy = TABLE_POLICIES[table];
      const cols = ownerColumns(policy, identity);
      const existing = await db
        .from(table)
        .select([plan.upsertCheck.col, ...cols].join(', '))
        .in(plan.upsertCheck.col, plan.upsertCheck.vals);
      if (existing.error) {
        return c.json({ data: null, error: { message: 'Query failed' } }, 500);
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
      const status = result.error.message?.startsWith('Invalid identifier') ? 400 : 500;
      return c.json({ data: null, error: { message: status === 400 ? 'Invalid column' : result.error.message, code: result.error.code } }, status);
    }
    return c.json({ ...result, data: redactRows(result.data) });
  });
}
