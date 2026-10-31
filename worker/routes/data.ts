import type { Context } from 'hono';
import type { Hono } from 'hono';
import type { WorkerEnv } from '../app.ts';
import { verifyJwtWeb } from '../../lib/auth/jwt.ts';
import { createNeonDatabase } from '../../lib/db/neonServerless.ts';
import { verifyAccountSession } from '../../lib/accountSessionAuth.ts';

const ALLOWED_TABLES = new Set([
  'guards',
  'staff',
  'clients',
  'certifications',
  'experience',
  'education',
  'security_requests',
  'payments',
  'guard_payout_invoices',
  'support_tickets',
  'support_messages',
  'push_subscriptions',
  'job_chat_threads',
  'job_chat_messages',
  'staff_messages',
  'guard_messages',
  'client_messages',
  'message_reactions',
  'chat_read_receipts',
  'user_notifications',
  'audit_log',
  'guard_availability',
  'guard_availability_date_overrides',
  'client_locations',
  'job_locations',
  'recurring_shift_templates',
  'compliance_alerts',
  'client_invoices',
  'device_account_bindings',
  'one_role_cases',
  'platform_settings',
  'platform_cities',
  'company_public_documents',
  'guard_insurance_policies',
  'notification_preferences',
  'staff_time_entries',
  'job_guard_slots',
  'user_legal_acceptances',
  'guard_vehicle_insurance_policies',
  'guard_vehicle_profiles',
  'staff_compensation_payouts',
]);

type QueryBody = {
  table?: string;
  operation?: 'select' | 'insert' | 'update' | 'delete' | 'upsert';
  columns?: string;
  payload?: Record<string, unknown> | Record<string, unknown>[];
  filters?: (
    | { col: string; op: 'eq'; val?: unknown }
    | { col: string; op: 'neq'; val?: unknown }
    | { col: string; op: 'in'; vals?: unknown[] }
  )[];
  upsertConflict?: string;
};

async function authorize(c: Context<{ Bindings: WorkerEnv }>) {
  const auth = c.req.header('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const jwt = token ? await verifyJwtWeb(token, c.env.JWT_SECRET) : null;

  const sessionHeader = c.req.header('x-guardr-session');
  let sessionCreds = null;
  if (sessionHeader) {
    try {
      sessionCreds = JSON.parse(sessionHeader) as { userId: string; email: string; role: string };
    } catch {
      sessionCreds = null;
    }
  }

  const db = createNeonDatabase(c.env.DATABASE_URL);
  if (sessionCreds) {
    const verified = await verifyAccountSession(db as never, sessionCreds);
    if (verified) return { db, session: verified, jwt };
  }
  if (jwt) {
    return {
      db,
      session: {
        userId: jwt.profileId,
        email: jwt.email,
        role: jwt.role,
        platformRole: jwt.role as never,
      },
      jwt,
    };
  }
  return null;
}

export function registerWorkerDataRoutes(app: Hono<{ Bindings: WorkerEnv }>) {
  app.post('/api/data/query', async (c) => {
    const auth = await authorize(c);
    if (!auth) return c.json({ error: 'Unauthorized' }, 401);

    const body = (await c.req.json<QueryBody>().catch(() => ({}))) as QueryBody;
    const table = body.table ?? '';
    const operation = body.operation ?? 'select';
    if (!ALLOWED_TABLES.has(table)) {
      return c.json({ error: 'Table not allowed' }, 403);
    }

    const { db } = auth;
    let builder =
      operation === 'select'
        ? db.from(table).select(body.columns ?? '*')
        : operation === 'insert'
          ? db.from(table).insert(body.payload ?? {})
          : operation === 'update'
            ? db.from(table).update((body.payload ?? {}) as Record<string, unknown>)
            : operation === 'upsert'
              ? db.from(table).upsert(body.payload ?? {}, { onConflict: body.upsertConflict })
              : db.from(table).delete();

    for (const f of body.filters ?? []) {
      if (f.op === 'eq') builder = builder.eq(f.col, f.val);
      else if (f.op === 'neq') builder = builder.neq(f.col, f.val);
      else if (f.op === 'in') builder = builder.in(f.col, f.vals ?? []);
    }

    const result = await builder;
    return c.json(result);
  });
}
