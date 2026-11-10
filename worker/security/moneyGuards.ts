/**
 * Authorization for every route that touches Stripe/Square (live money).
 *
 * Runs before the legacy route handlers. Identity is the verified JWT account
 * (role re-read from the database) from lib/auth/requestIdentity.ts.
 */
import type { Context, Hono, Next } from 'hono';
import type { WorkerEnv } from '../app.ts';
import { createNeonDatabase } from '../../lib/db/neonServerless.ts';
import { currentRequestIdentity, isFounderIdentity, type RequestIdentity } from '../../lib/auth/requestIdentity.ts';
import { hasFinancePlatformAccess, isStaffPlatformRole } from '../../lib/accountSessionAuth.ts';

type Ctx = Context<{ Bindings: WorkerEnv }>;
type Json = Record<string, unknown>;

async function readJson(c: Ctx): Promise<Json> {
  try {
    const parsed = await c.req.raw.clone().json();
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Json) : {};
  } catch {
    return {};
  }
}

export function isStaffIdentity(identity: RequestIdentity | null): boolean {
  return !!identity && isStaffPlatformRole(identity.platformRole);
}

export function isFinanceIdentity(identity: RequestIdentity | null): boolean {
  return (
    !!identity &&
    isStaffPlatformRole(identity.platformRole) &&
    hasFinancePlatformAccess(identity.platformRole, identity.sideRole)
  );
}

function unauthorized(c: Ctx) {
  return c.json({ error: 'Sign in required' }, 401);
}
function forbidden(c: Ctx, message = 'Not allowed') {
  return c.json({ error: message }, 403);
}

async function loadJob(c: Ctx, jobId: string) {
  const db = createNeonDatabase(c.env.DATABASE_URL);
  const { data } = await db
    .from('security_requests')
    .select('id, client_id, assigned_guard_id, stripe_payment_intent_id')
    .eq('id', jobId)
    .maybeSingle();
  return (data as Json | null) ?? null;
}

async function ownConnectAccountId(c: Ctx, identity: RequestIdentity): Promise<string | null> {
  if (identity.profileKind === 'client') return null;
  const db = createNeonDatabase(c.env.DATABASE_URL);
  const table = identity.profileKind === 'staff' ? 'staff' : 'guards';
  const { data } = await db
    .from(table)
    .select('stripe_connect_account_id')
    .eq('id', identity.profileId)
    .maybeSingle();
  const id = (data as Json | null)?.stripe_connect_account_id;
  return typeof id === 'string' && id ? id : null;
}

/** Client charge routes: the signed-in client must own the job (staff may act for any job). */
async function requireJobPayer(c: Ctx, next: Next) {
  const identity = currentRequestIdentity();
  if (!identity) return unauthorized(c);
  const body = await readJson(c);
  const jobId = typeof body.jobId === 'string' ? body.jobId : '';
  if (!jobId) return c.json({ error: 'jobId is required' }, 400);
  if (!isStaffIdentity(identity)) {
    if (identity.platformRole !== 'client') return forbidden(c, 'Only the job’s client can pay for it');
    const job = await loadJob(c, jobId);
    if (!job) return c.json({ error: 'Job not found' }, 404);
    if (job.client_id !== identity.profileId) return forbidden(c, 'This job belongs to another client');
  }
  return next();
}

export function registerMoneyRouteGuards(app: Hono<{ Bindings: WorkerEnv }>) {
  // Payout to a guard (live transfer): finance staff only; `force` is Founder/Owner only;
  // the destination must be the assigned guard's own Connect account.
  app.post('/api/stripe/payout/release', async (c, next) => {
    const identity = currentRequestIdentity();
    if (!identity) return unauthorized(c);
    if (!isFinanceIdentity(identity)) return forbidden(c, 'Payout release requires finance staff');
    const body = await readJson(c);
    if (body.force === true && !isFounderIdentity(identity)) {
      return forbidden(c, 'Forced payout release is limited to the Founder');
    }
    const jobId = typeof body.jobId === 'string' ? body.jobId : '';
    const destination = typeof body.guardConnectAccountId === 'string' ? body.guardConnectAccountId : '';
    if (!jobId || !destination) {
      return c.json({ error: 'jobId and guardConnectAccountId are required' }, 400);
    }
    const job = await loadJob(c, jobId);
    if (!job) return c.json({ error: 'Job not found' }, 404);
    if (!job.assigned_guard_id) return c.json({ error: 'Job has no assigned guard' }, 400);
    const db = createNeonDatabase(c.env.DATABASE_URL);
    const { data: guard } = await db
      .from('guards')
      .select('stripe_connect_account_id')
      .eq('id', String(job.assigned_guard_id))
      .maybeSingle();
    if ((guard as Json | null)?.stripe_connect_account_id !== destination) {
      return forbidden(c, 'Payout destination does not match the assigned guard');
    }
    return next();
  });

  for (const path of ['/api/stripe/payment/hold', '/api/stripe/payment/refund']) {
    app.post(path, async (c, next) => {
      const identity = currentRequestIdentity();
      if (!identity) return unauthorized(c);
      if (!isFinanceIdentity(identity)) return forbidden(c, 'Requires finance staff');
      if (path.endsWith('/refund')) {
        const body = await readJson(c);
        const jobId = typeof body.jobId === 'string' ? body.jobId : '';
        const pi = typeof body.paymentIntentId === 'string' ? body.paymentIntentId : '';
        if (!jobId || !pi) return c.json({ error: 'jobId and paymentIntentId are required' }, 400);
        const job = await loadJob(c, jobId);
        if (!job) return c.json({ error: 'Job not found' }, 404);
        if (job.stripe_payment_intent_id !== pi) {
          return forbidden(c, 'Payment does not belong to this job');
        }
      }
      return next();
    });
  }

  // Stripe Connect: a guard/staff member may only manage their own Connect account.
  app.post('/api/stripe/connect/create-account', async (c, next) => {
    const identity = currentRequestIdentity();
    if (!identity) return unauthorized(c);
    const body = await readJson(c);
    const subject = (typeof body.staffId === 'string' && body.staffId) || (typeof body.guardId === 'string' && body.guardId) || '';
    if (!subject) return c.json({ error: 'guardId or staffId is required' }, 400);
    if (subject !== identity.profileId && !isFinanceIdentity(identity)) {
      return forbidden(c, 'You can only set up payouts for your own account');
    }
    if (identity.platformRole === 'client') return forbidden(c, 'Clients do not receive payouts');
    return next();
  });

  for (const path of ['/api/stripe/connect/account-session', '/api/stripe/connect/account-link']) {
    app.post(path, async (c, next) => {
      const identity = currentRequestIdentity();
      if (!identity) return unauthorized(c);
      const body = await readJson(c);
      const accountId = typeof body.accountId === 'string' ? body.accountId : '';
      if (!accountId) return c.json({ error: 'accountId is required' }, 400);
      if (isFinanceIdentity(identity)) return next();
      if (accountId !== (await ownConnectAccountId(c, identity))) {
        return forbidden(c, 'That payout account is not yours');
      }
      return next();
    });
  }

  app.get('/api/stripe/connect/status/:accountId', async (c, next) => {
    const identity = currentRequestIdentity();
    if (!identity) return unauthorized(c);
    if (isStaffIdentity(identity)) return next();
    if (c.req.param('accountId') !== (await ownConnectAccountId(c, identity))) {
      return forbidden(c, 'That payout account is not yours');
    }
    return next();
  });

  // Client charges (live): only the job's own client, or staff.
  for (const path of [
    '/api/stripe/payment-intent/create',
    '/api/stripe/checkout/create-session',
    '/api/stripe/checkout/overtime-charge',
    '/api/stripe/checkout/tip-charge',
    '/api/stripe/checkout/schedule-change-charge',
    '/api/stripe/checkout/cash-deposit',
    '/api/square/checkout/create-payment',
  ]) {
    app.post(path, requireJobPayer);
  }

  app.get('/api/stripe/payments', async (c, next) => {
    if (!isFinanceIdentity(currentRequestIdentity())) return unauthorized(c);
    return next();
  });
}
