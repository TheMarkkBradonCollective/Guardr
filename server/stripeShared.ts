import Stripe from 'stripe';
import {
  computeGuardPayoutCents,
  LEGACY_PLATFORM_FEE_PER_HOUR,
} from '../lib/platformFees';
import { getSupabaseAdmin } from './supabaseAdmin';

const GUARD_PAY_PLATFORM_FEE = LEGACY_PLATFORM_FEE_PER_HOUR;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key === 'sk_test_placeholder') return null;
  return new Stripe(key);
}

export { computeGuardPayoutCents };

export async function markJobPaid(
  jobId: string,
  paymentIntentId: string | null,
  sessionId: string,
  amountCents: number
) {
  const db = getSupabaseAdmin();
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

  try {
    const { notifyPaymentAttention } = await import('../lib/push/paymentNotifications');
    await notifyPaymentAttention(db, {
      requestId: jobId,
      body: 'Client card payment received — job may be ready for guard assignment',
    });
  } catch (err) {
    console.warn('Payment push notification failed:', err);
  }
}

export async function markJobHeld(jobId: string) {
  const db = getSupabaseAdmin();
  if (!db) return;

  await db.from('security_requests').update({ payment_status: 'held' }).eq('id', jobId);
  await db
    .from('payments')
    .update({ status: 'held', updated_at: new Date().toISOString() })
    .eq('job_id', jobId)
    .in('status', ['paid']);
}

function computeRequiredCashDeposit(job: {
  estimated_payout: number;
  duration_hours: number;
  platform_fee_per_hour?: number | null;
  guard_payout_method?: string | null;
}): number {
  const feePerHour = job.platform_fee_per_hour ?? GUARD_PAY_PLATFORM_FEE;
  if (job.guard_payout_method === 'cash') {
    return Math.round(job.duration_hours * feePerHour * 100) / 100;
  }
  return Number(job.estimated_payout);
}

/** Director paid client cash into platform Stripe balance with their own card */
export async function markCashDeposit(
  jobId: string,
  paymentIntentId: string | null,
  sessionId: string,
  amountCents: number
) {
  const db = getSupabaseAdmin();
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

  if (fullyDeposited) {
    try {
      const { notifyPaymentAttention } = await import('../lib/push/paymentNotifications');
      await notifyPaymentAttention(db, {
        requestId: jobId,
        body: `Cash deposit completed for job — $${newDeposited.toFixed(2)} received via Stripe`,
      });
    } catch (err) {
      console.warn('Cash deposit push notification failed:', err);
    }
  }
}

export async function markJobReleased(jobId: string, transferId: string) {
  const db = getSupabaseAdmin();
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

  try {
    const { notifyPaymentAttention } = await import('../lib/push/paymentNotifications');
    await notifyPaymentAttention(db, {
      requestId: jobId,
      body: 'Guard payout released via Stripe',
    });
  } catch (err) {
    console.warn('Payout release push notification failed:', err);
  }
}

export async function processStripeWebhookEvent(event: Stripe.Event) {
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
        const db = getSupabaseAdmin();
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

      const db = getSupabaseAdmin();
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
      const db = getSupabaseAdmin();
      if (db && jobId) {
        await db
          .from('payments')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('job_id', jobId);
      }
      console.error('Stripe transfer reversed:', transfer.id, jobId);
      break;
    }

    case 'payout.paid':
    case 'payout.failed': {
      const payout = event.data.object as Stripe.Payout;
      console.log(`Stripe payout ${event.type}:`, payout.id, payout.status);
      break;
    }

    default:
      break;
  }
}
