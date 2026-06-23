import type { VercelRequest, VercelResponse } from '@vercel/node';
import type Stripe from 'stripe';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key === 'sk_test_placeholder') return null;
  const { default: StripeSdk } = await import('stripe');
  return new StripeSdk(key);
}

async function getSupabaseAdmin() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body, 'utf8');

  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    req.on('data', (chunk: Buffer | string) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    req.on('end', () => resolve());
    req.on('error', reject);
  });
  return Buffer.concat(chunks);
}

async function markJobPaid(
  jobId: string,
  paymentIntentId: string | null,
  sessionId: string,
  amountCents: number
) {
  const db = await getSupabaseAdmin();
  if (!db) return;

  const amount = amountCents / 100;

  await db
    .from('security_requests')
    .update({
      payment_status: 'paid',
      stripe_payment_intent_id: paymentIntentId,
    })
    .eq('id', jobId);

  const { data: existing } = await db
    .from('payments')
    .select('id')
    .eq('stripe_session_id', sessionId)
    .maybeSingle();

  if (existing?.id) {
    await db
      .from('payments')
      .update({
        status: 'paid',
        stripe_payment_intent_id: paymentIntentId,
        amount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await db.from('payments').insert({
      id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      job_id: jobId,
      amount,
      stripe_session_id: sessionId,
      stripe_payment_intent_id: paymentIntentId,
      status: 'paid',
    });
  }
}

import { LEGACY_PLATFORM_FEE_PER_HOUR } from '../../lib/platformFees';

const PLATFORM_FEE_PER_HOUR = LEGACY_PLATFORM_FEE_PER_HOUR;

function computeRequiredCashDeposit(job: {
  estimated_payout: number;
  duration_hours: number;
  platform_fee_per_hour?: number | null;
  guard_payout_method?: string | null;
}): number {
  const feePerHour = job.platform_fee_per_hour ?? PLATFORM_FEE_PER_HOUR;
  if (job.guard_payout_method === 'cash') {
    return Math.round(job.duration_hours * feePerHour * 100) / 100;
  }
  return Number(job.estimated_payout);
}

async function markCashDeposit(
  jobId: string,
  paymentIntentId: string | null,
  sessionId: string,
  amountCents: number
) {
  const db = await getSupabaseAdmin();
  if (!db) return;

  const { data: job } = await db
    .from('security_requests')
    .select(
      'estimated_payout, duration_hours, platform_fee_per_hour, guard_payout_method, cash_deposited_amount, client_payment_method'
    )
    .eq('id', jobId)
    .maybeSingle();

  if (!job || job.client_payment_method !== 'cash') return;

  const depositAmount = amountCents / 100;
  const currentDeposited = Number(job.cash_deposited_amount ?? 0);
  const newDeposited = Math.round((currentDeposited + depositAmount) * 100) / 100;
  const requiredTotal = computeRequiredCashDeposit(job);
  const fullyDeposited = newDeposited >= requiredTotal - 0.01;
  const depositedAt = new Date().toISOString();

  await db
    .from('security_requests')
    .update({
      cash_deposited_amount: newDeposited,
      cash_deposited_to_stripe: fullyDeposited,
      cash_deposited_at: depositedAt,
    })
    .eq('id', jobId);

  const { data: existing } = await db
    .from('payments')
    .select('id')
    .eq('stripe_session_id', sessionId)
    .maybeSingle();

  if (existing?.id) {
    await db
      .from('payments')
      .update({
        status: 'paid',
        stripe_payment_intent_id: paymentIntentId,
        amount: depositAmount,
        payment_method: 'stripe',
        updated_at: depositedAt,
      })
      .eq('id', existing.id);
  } else {
    await db.from('payments').insert({
      id: `pay-deposit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      job_id: jobId,
      amount: depositAmount,
      stripe_session_id: sessionId,
      stripe_payment_intent_id: paymentIntentId,
      status: 'paid',
      payment_method: 'stripe',
    });
  }
}

async function markOvertimePaid(
  jobId: string,
  paymentIntentId: string | null,
  sessionId: string,
  amountCents: number
) {
  const db = await getSupabaseAdmin();
  if (!db) return;

  const amount = amountCents / 100;
  const paidAt = new Date().toISOString();

  const { data: job } = await db
    .from('security_requests')
    .select(
      'scheduled_duration_hours, scheduled_estimated_payout, overtime_hours, overtime_amount, duration_hours, estimated_payout'
    )
    .eq('id', jobId)
    .maybeSingle();

  const scheduledDuration = Number(job?.scheduled_duration_hours ?? job?.duration_hours ?? 0);
  const scheduledPayout = Number(job?.scheduled_estimated_payout ?? job?.estimated_payout ?? 0);
  const overtimeHours = Number(job?.overtime_hours ?? 0);
  const overtimeAmount = Number(job?.overtime_amount ?? 0);

  await db
    .from('security_requests')
    .update({
      overtime_payment_status: 'paid',
      overtime_status: 'paid',
      overtime_client_payment_method: 'stripe',
      overtime_client_cash_payment_requested: false,
      overtime_client_cash_payment_requested_at: null,
      duration_hours: Math.round((scheduledDuration + overtimeHours) * 100) / 100,
      estimated_payout: Math.round((scheduledPayout + overtimeAmount) * 100) / 100,
    })
    .eq('id', jobId);

  const { data: existing } = await db
    .from('payments')
    .select('id')
    .eq('stripe_session_id', sessionId)
    .maybeSingle();

  if (existing?.id) {
    await db
      .from('payments')
      .update({
        status: 'paid',
        stripe_payment_intent_id: paymentIntentId,
        amount,
        payment_method: 'stripe',
        updated_at: paidAt,
      })
      .eq('id', existing.id);
  } else {
    await db.from('payments').insert({
      id: `pay-overtime-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      job_id: jobId,
      amount,
      stripe_session_id: sessionId,
      stripe_payment_intent_id: paymentIntentId,
      status: 'paid',
      payment_method: 'stripe',
    });
  }
}

async function markJobReleased(jobId: string, transferId: string) {
  const db = await getSupabaseAdmin();
  if (!db) return;

  await db
    .from('security_requests')
    .update({ payment_status: 'released', guard_payout_method: 'stripe' })
    .eq('id', jobId);
  await db
    .from('payments')
    .update({
      status: 'released',
      stripe_transfer_id: transferId,
      updated_at: new Date().toISOString(),
    })
    .eq('job_id', jobId);
}

async function processStripeWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const jobId = session.metadata?.job_id;
      if (!jobId) break;

      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id ?? null;

      if (session.metadata?.checkout_type === 'cash_deposit') {
        await markCashDeposit(jobId, paymentIntentId, session.id, session.amount_total ?? 0);
      } else if (session.metadata?.checkout_type === 'overtime') {
        await markOvertimePaid(jobId, paymentIntentId, session.id, session.amount_total ?? 0);
      } else {
        await markJobPaid(jobId, paymentIntentId, session.id, session.amount_total ?? 0);
      }
      break;
    }

    case 'payment_intent.succeeded': {
      const intent = event.data.object as Stripe.PaymentIntent;
      const jobId = intent.metadata?.job_id;
      if (!jobId) break;

      if (intent.metadata?.checkout_type === 'cash_deposit') {
        const db = await getSupabaseAdmin();
        if (db) {
          await db
            .from('payments')
            .update({
              status: 'paid',
              stripe_payment_intent_id: intent.id,
              amount: (intent.amount_received ?? intent.amount) / 100,
              payment_method: 'stripe',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_payment_intent_id', intent.id);
        }
        break;
      }

      if (intent.metadata?.checkout_type === 'overtime') {
        const db = await getSupabaseAdmin();
        if (db) {
          const { data: job } = await db
            .from('security_requests')
            .select(
              'scheduled_duration_hours, scheduled_estimated_payout, overtime_hours, overtime_amount, duration_hours, estimated_payout'
            )
            .eq('id', jobId)
            .maybeSingle();

          const scheduledDuration = Number(job?.scheduled_duration_hours ?? job?.duration_hours ?? 0);
          const scheduledPayout = Number(job?.scheduled_estimated_payout ?? job?.estimated_payout ?? 0);
          const overtimeHours = Number(job?.overtime_hours ?? 0);
          const overtimeAmount = Number(job?.overtime_amount ?? 0);

          await db
            .from('security_requests')
            .update({
              overtime_payment_status: 'paid',
              overtime_status: 'paid',
              overtime_client_payment_method: 'stripe',
              duration_hours: Math.round((scheduledDuration + overtimeHours) * 100) / 100,
              estimated_payout: Math.round((scheduledPayout + overtimeAmount) * 100) / 100,
            })
            .eq('id', jobId);

          await db
            .from('payments')
            .update({
              status: 'paid',
              stripe_payment_intent_id: intent.id,
              amount: (intent.amount_received ?? intent.amount) / 100,
              payment_method: 'stripe',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_payment_intent_id', intent.id);
        }
        break;
      }

      const db = await getSupabaseAdmin();
      if (db) {
        await db
          .from('security_requests')
          .update({
            payment_status: 'paid',
            stripe_payment_intent_id: intent.id,
          })
          .eq('id', jobId);

        await db
          .from('payments')
          .update({
            status: 'paid',
            stripe_payment_intent_id: intent.id,
            amount: (intent.amount_received ?? intent.amount) / 100,
            updated_at: new Date().toISOString(),
          })
          .eq('job_id', jobId);
      }
      break;
    }

    case 'transfer.created':
    case 'transfer.updated': {
      const transfer = event.data.object as Stripe.Transfer;
      const jobId = transfer.metadata?.job_id;
      if (jobId && !transfer.reversed) {
        await markJobReleased(jobId, transfer.id);
      }
      break;
    }

    case 'transfer.reversed': {
      const transfer = event.data.object as Stripe.Transfer;
      const jobId = transfer.metadata?.job_id;
      const db = await getSupabaseAdmin();
      if (db && jobId) {
        await db
          .from('payments')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('job_id', jobId);
      }
      console.error('Stripe transfer reversed:', transfer.id, jobId);
      break;
    }

    default:
      break;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = await getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return res.status(503).json({ error: 'Stripe webhooks not configured' });
  }

  const signature = req.headers['stripe-signature'];
  if (!signature || typeof signature !== 'string') {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    return res.status(400).json({ error: `Webhook Error: ${message}` });
  }

  try {
    await processStripeWebhookEvent(event);
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }

  return res.status(200).json({ received: true });
}
