import type Stripe from 'stripe';
import type { AppDb } from '../db/adminClient.ts';
import { getSiteUrl } from '../siteConfig.ts';

export type CreateBookingCheckoutInput = {
  jobId: string;
  clientEmail: string;
  jobTitle?: string;
  amountCents: number;
};

export type CreateBookingCheckoutResult =
  | { ok: true; sessionId: string; url: string | null }
  | { ok: false; status: number; error: string };

/** Stripe Checkout for the primary client job payment (metadata checkout_type job_payment). */
export async function createBookingCheckoutSession(
  stripe: Stripe,
  db: AppDb | null,
  input: CreateBookingCheckoutInput
): Promise<CreateBookingCheckoutResult> {
  const { jobId, clientEmail, jobTitle, amountCents } = input;

  if (!jobId || !clientEmail || !amountCents) {
    return { ok: false, status: 400, error: 'jobId, clientEmail, and amountCents are required' };
  }

  if (db) {
    const { data: settings } = await db
      .from('platform_settings')
      .select('payment_stripe_enabled')
      .eq('id', 'default')
      .maybeSingle();

    if (settings && settings.payment_stripe_enabled === false) {
      return { ok: false, status: 400, error: 'Online card payments are not enabled on this platform' };
    }

    const { data: job } = await db
      .from('security_requests')
      .select('payment_status, status')
      .eq('id', jobId)
      .maybeSingle();

    if (!job) {
      return { ok: false, status: 404, error: 'Job not found' };
    }

    if (job.status !== 'open') {
      return { ok: false, status: 400, error: 'This job must be approved by staff before payment' };
    }

    if (job.payment_status && job.payment_status !== 'unpaid') {
      return { ok: false, status: 400, error: 'This job already has a payment on file' };
    }
  }

  const base = getSiteUrl();
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: clientEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: amountCents,
          product_data: {
            name: jobTitle || `Guardr Job ${jobId}`,
            description: 'Security services payment — funds held by Guardr until shift completion.',
          },
        },
      },
    ],
    payment_intent_data: {
      metadata: { job_id: jobId, checkout_type: 'job_payment' },
    },
    metadata: { job_id: jobId, checkout_type: 'job_payment' },
    success_url: `${base}/client/invoices?payment=success&job_id=${jobId}`,
    cancel_url: `${base}/client/invoices?payment=cancelled&job_id=${jobId}`,
  });

  if (db) {
    await db.from('payments').insert({
      id: `pay-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      job_id: jobId,
      amount: amountCents / 100,
      stripe_session_id: session.id,
      status: 'pending',
    });
  }

  return { ok: true, sessionId: session.id, url: session.url };
}
