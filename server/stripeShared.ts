import Stripe from 'stripe';
import { getSupabaseAdmin } from './supabaseAdmin';

const GUARD_PAY_PLATFORM_FEE = 5;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key === 'sk_test_placeholder') return null;
  return new Stripe(key);
}

export function computeGuardPayoutCents(hourlyRate: number, durationHours: number): number {
  const guardPay = Math.max(0, hourlyRate - GUARD_PAY_PLATFORM_FEE);
  return Math.round(durationHours * guardPay * 100);
}

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

export async function markJobReleased(jobId: string, transferId: string) {
  const db = getSupabaseAdmin();
  if (!db) return;

  await db.from('security_requests').update({ payment_status: 'released' }).eq('id', jobId);
  await db
    .from('payments')
    .update({
      status: 'released',
      stripe_transfer_id: transferId,
      updated_at: new Date().toISOString(),
    })
    .eq('job_id', jobId);
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

      await markJobPaid(jobId, paymentIntentId, session.id, session.amount_total ?? 0);
      break;
    }

    case 'payment_intent.succeeded': {
      const intent = event.data.object as Stripe.PaymentIntent;
      const jobId = intent.metadata?.job_id;
      if (!jobId) break;

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
