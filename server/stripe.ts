import type { Express, Request, Response } from 'express';
import express from 'express';
import Stripe from 'stripe';
import { getSupabaseAdmin } from './supabaseAdmin';
import { getSiteUrl } from './siteConfig';

const GUARD_PAY_PLATFORM_FEE = 5;

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key === 'sk_test_placeholder') return null;
  return new Stripe(key);
}

function computeGuardPayoutCents(hourlyRate: number, durationHours: number): number {
  const guardPay = Math.max(0, hourlyRate - GUARD_PAY_PLATFORM_FEE);
  return Math.round(durationHours * guardPay * 100);
}

async function markJobPaid(
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

async function markJobHeld(jobId: string) {
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

async function markCashDeposit(
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
}

async function markJobReleased(jobId: string, transferId: string) {
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
}

/** Stripe webhook — must be registered before express.json() middleware */
export function registerStripeWebhook(app: Express) {
  const stripe = getStripe();

  app.post(
    '/api/stripe/webhook',
    express.raw({ type: 'application/json' }),
    async (req: Request, res: Response) => {
      const stripeClient = getStripe();
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!stripeClient || !webhookSecret) {
        console.warn('Stripe webhook: missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET');
        return res.status(503).json({ error: 'Stripe webhooks not configured' });
      }

      const signature = req.headers['stripe-signature'];
      if (!signature || typeof signature !== 'string') {
        return res.status(400).json({ error: 'Missing stripe-signature header' });
      }

      let event: Stripe.Event;
      try {
        event = stripeClient.webhooks.constructEvent(req.body, signature, webhookSecret);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Invalid signature';
        console.error('Webhook signature verification failed:', message);
        return res.status(400).json({ error: `Webhook Error: ${message}` });
      }

      try {
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
      } catch (err) {
        console.error('Webhook handler error:', err);
        return res.status(500).json({ error: 'Webhook handler failed' });
      }

      return res.json({ received: true });
    }
  );
}

export function registerStripeRoutes(app: Express) {
  const stripe = getStripe();

  // ── Connect: create Express account ────────────────────────
  app.post('/api/stripe/connect/create-account', async (req: Request, res: Response) => {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured' });
    }

    const { guardId, email, name } = req.body as {
      guardId?: string;
      email?: string;
      name?: string;
    };

    if (!guardId || !email) {
      return res.status(400).json({ error: 'guardId and email are required' });
    }

    try {
      const db = getSupabaseAdmin();
      let accountId: string | null = null;

      if (db) {
        const { data: guard } = await db
          .from('guards')
          .select('stripe_connect_account_id')
          .eq('id', guardId)
          .maybeSingle();
        accountId = guard?.stripe_connect_account_id ?? null;
      }

      if (!accountId) {
        const account = await stripe.accounts.create({
          type: 'express',
          email,
          metadata: { guard_id: guardId },
          capabilities: {
            transfers: { requested: true },
          },
          business_type: 'individual',
          ...(name ? { business_profile: { name } } : {}),
        });
        accountId = account.id;

        if (db) {
          await db
            .from('guards')
            .update({ stripe_connect_account_id: accountId })
            .eq('id', guardId);
        }
      }

      return res.json({ accountId });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create Connect account';
      console.error('Connect account error:', message);
      return res.status(500).json({ error: message });
    }
  });

  // ── Connect: onboarding link ───────────────────────────────
  app.post('/api/stripe/connect/account-link', async (req: Request, res: Response) => {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured' });
    }

    const { accountId } = req.body as { accountId?: string };
    if (!accountId) {
      return res.status(400).json({ error: 'accountId is required' });
    }

    try {
      const base = getSiteUrl();
      const link = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: `${base}/?stripe_connect=refresh`,
        return_url: `${base}/?stripe_connect=success`,
        type: 'account_onboarding',
      });
      return res.json({ url: link.url });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create account link';
      return res.status(500).json({ error: message });
    }
  });

  // ── Connect: account status ────────────────────────────────
  app.get('/api/stripe/connect/status/:accountId', async (req: Request, res: Response) => {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured' });
    }

    try {
      const account = await stripe.accounts.retrieve(req.params.accountId);
      return res.json({
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        detailsSubmitted: account.details_submitted,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to retrieve account';
      return res.status(500).json({ error: message });
    }
  });

  // ── Checkout: Director pays client cash into Stripe with their card ──
  app.post('/api/stripe/checkout/cash-deposit', async (req: Request, res: Response) => {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured' });
    }

    const { jobId, directorEmail, jobTitle, amountCents } = req.body as {
      jobId?: string;
      directorEmail?: string;
      jobTitle?: string;
      amountCents?: number;
    };

    if (!jobId || !directorEmail || !amountCents || amountCents < 50) {
      return res.status(400).json({ error: 'jobId, directorEmail, and amountCents (≥50) are required' });
    }

    try {
      const base = getSiteUrl();
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: directorEmail,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: amountCents,
              product_data: {
                name: jobTitle ? `Cash deposit — ${jobTitle}` : `Cash deposit — ${jobId}`,
                description:
                  'Pay with your card to fund the platform Stripe balance for a client cash job (same as a client card payment).',
              },
            },
          },
        ],
        payment_intent_data: {
          metadata: { job_id: jobId, checkout_type: 'cash_deposit' },
        },
        metadata: { job_id: jobId, checkout_type: 'cash_deposit' },
        success_url: `${base}/?deposit=success&job_id=${jobId}`,
        cancel_url: `${base}/?deposit=cancelled&job_id=${jobId}`,
      });

      const db = getSupabaseAdmin();
      if (db) {
        await db.from('payments').insert({
          id: `pay-deposit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          job_id: jobId,
          amount: amountCents / 100,
          stripe_session_id: session.id,
          status: 'pending',
          payment_method: 'stripe',
        });
      }

      return res.json({ sessionId: session.id, url: session.url });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create cash deposit checkout';
      console.error('Cash deposit checkout error:', message);
      return res.status(500).json({ error: message });
    }
  });

  // ── Checkout: create session for approved job ────────────────
  app.post('/api/stripe/checkout/create-session', async (req: Request, res: Response) => {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured' });
    }

    const { jobId, clientEmail, jobTitle, amountCents } = req.body as {
      jobId?: string;
      clientEmail?: string;
      jobTitle?: string;
      amountCents?: number;
    };

    if (!jobId || !clientEmail || !amountCents) {
      return res.status(400).json({ error: 'jobId, clientEmail, and amountCents are required' });
    }

    try {
      const db = getSupabaseAdmin();
      if (db) {
        const { data: job } = await db
          .from('security_requests')
          .select('payment_status, status')
          .eq('id', jobId)
          .maybeSingle();

        if (!job) {
          return res.status(404).json({ error: 'Job not found' });
        }

        if (job.status !== 'open') {
          return res.status(400).json({ error: 'This job must be approved by staff before payment' });
        }

        if (job.payment_status && job.payment_status !== 'unpaid') {
          return res.status(400).json({ error: 'This job already has a payment on file' });
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
          metadata: { job_id: jobId },
        },
        metadata: { job_id: jobId },
        success_url: `${base}/?payment=success&job_id=${jobId}`,
        cancel_url: `${base}/?payment=cancelled&job_id=${jobId}`,
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

      return res.json({ sessionId: session.id, url: session.url });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create checkout session';
      console.error('Checkout session error:', message);
      return res.status(500).json({ error: message });
    }
  });

  // ── Payout: transfer to guard Connect account ──────────────
  app.post('/api/stripe/payout/release', async (req: Request, res: Response) => {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured' });
    }

    const { jobId, guardConnectAccountId, hourlyRate, durationHours, force } = req.body as {
      jobId?: string;
      guardConnectAccountId?: string;
      hourlyRate?: number;
      durationHours?: number;
      force?: boolean;
    };

    if (!jobId || !guardConnectAccountId || hourlyRate == null || durationHours == null) {
      return res.status(400).json({
        error: 'jobId, guardConnectAccountId, hourlyRate, and durationHours are required',
      });
    }

    const db = getSupabaseAdmin();
    if (db) {
      const { data: job } = await db
        .from('security_requests')
        .select(
          'status, payment_status, assigned_guard_id, guard_payout_method, guard_cash_payout_requested'
        )
        .eq('id', jobId)
        .maybeSingle();

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      if (job.status !== 'completed' && !force) {
        return res.status(400).json({ error: 'Job must be completed before payout release' });
      }

      if (job.payment_status === 'released') {
        return res.status(400).json({ error: 'Payout already released for this job' });
      }

      if (!['paid', 'held'].includes(job.payment_status ?? '') && !force) {
        return res.status(400).json({ error: 'Job payment must be paid or held before payout' });
      }

      if (job.guard_payout_method === 'cash') {
        return res.status(400).json({ error: 'Guard was paid in cash for this shift' });
      }

    }

    const amountCents = computeGuardPayoutCents(hourlyRate, durationHours);
    if (amountCents <= 0) {
      return res.status(400).json({ error: 'Invalid payout amount' });
    }

    try {
      const transfer = await stripe.transfers.create({
        amount: amountCents,
        currency: 'usd',
        destination: guardConnectAccountId,
        metadata: { job_id: jobId },
      });

      await markJobReleased(jobId, transfer.id);

      return res.json({
        transferId: transfer.id,
        amountCents,
        status: 'released',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transfer failed';
      console.error('Payout release error:', message);

      if (db) {
        await db
          .from('payments')
          .update({ status: 'failed', updated_at: new Date().toISOString() })
          .eq('job_id', jobId);
      }

      return res.status(500).json({ error: message });
    }
  });

  // ── Hold funds when job completes ────────────────────────────
  app.post('/api/stripe/payment/hold', async (req: Request, res: Response) => {
    const { jobId } = req.body as { jobId?: string };
    if (!jobId) {
      return res.status(400).json({ error: 'jobId is required' });
    }

    await markJobHeld(jobId);
    return res.json({ status: 'held' });
  });

  // ── Director: refund payment ─────────────────────────────────
  app.post('/api/stripe/payment/refund', async (req: Request, res: Response) => {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured' });
    }

    const { paymentIntentId, jobId } = req.body as {
      paymentIntentId?: string;
      jobId?: string;
    };

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'paymentIntentId is required' });
    }

    try {
      const refund = await stripe.refunds.create({ payment_intent: paymentIntentId });

      const db = getSupabaseAdmin();
      if (db && jobId) {
        await db.from('security_requests').update({ payment_status: 'unpaid' }).eq('id', jobId);
        await db
          .from('payments')
          .update({ status: 'refunded', updated_at: new Date().toISOString() })
          .eq('job_id', jobId);
      }

      return res.json({ refundId: refund.id, status: refund.status });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Refund failed';
      return res.status(500).json({ error: message });
    }
  });

  // ── List payments for admin dashboard ──────────────────────
  app.get('/api/stripe/payments', async (_req: Request, res: Response) => {
    const db = getSupabaseAdmin();
    if (!db) {
      return res.json({ payments: [] });
    }

    const { data, error } = await db
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ payments: data ?? [] });
  });

  app.get('/api/stripe/health', (_req: Request, res: Response) => {
    res.json({
      configured: !!stripe,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null,
    });
  });
}
