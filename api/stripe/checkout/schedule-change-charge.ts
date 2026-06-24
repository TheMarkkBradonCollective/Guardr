import type { VercelRequest, VercelResponse } from '@vercel/node';

function getSiteUrl(): string {
  const configured = process.env.APP_URL?.trim().replace(/\/$/, '');
  if (configured) return configured;
  return process.env.VERCEL ? 'https://www.guardr.co' : 'http://localhost:3000';
}

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = await getStripe();
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe is not configured' });
  }

  const { jobId, clientEmail, jobTitle, amountCents } = (req.body ?? {}) as {
    jobId?: string;
    clientEmail?: string;
    jobTitle?: string;
    amountCents?: number;
  };

  if (!jobId || !clientEmail || !amountCents || amountCents < 50) {
    return res.status(400).json({ error: 'jobId, clientEmail, and amountCents (≥50) are required' });
  }

  try {
    const db = await getSupabaseAdmin();
    if (db) {
      const { data: settings } = await db
        .from('platform_settings')
        .select('payment_stripe_enabled')
        .eq('id', 'default')
        .maybeSingle();

      if (settings && settings.payment_stripe_enabled === false) {
        return res.status(400).json({ error: 'Online card payments are not enabled on this platform' });
      }

      const { data: job } = await db
        .from('security_requests')
        .select(
          'status, schedule_change_status, schedule_change_extra_amount, pending_start_date, pending_end_date'
        )
        .eq('id', jobId)
        .maybeSingle();

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      if (job.schedule_change_status !== 'awaiting_payment') {
        return res.status(400).json({ error: 'Schedule extension must be approved before payment' });
      }

      if (!job.pending_start_date || !job.pending_end_date) {
        return res.status(400).json({ error: 'Pending schedule change is incomplete' });
      }

      const expectedCents = Math.round(Number(job.schedule_change_extra_amount ?? 0) * 100);
      if (expectedCents > 0 && amountCents !== expectedCents) {
        return res.status(400).json({ error: 'Amount does not match the schedule extension due' });
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
              name: jobTitle ? `Schedule extension — ${jobTitle}` : `Schedule extension — ${jobId}`,
              description: 'Additional charge for extending a paid shift.',
            },
          },
        },
      ],
      payment_intent_data: {
        metadata: { job_id: jobId, checkout_type: 'schedule_change' },
      },
      metadata: { job_id: jobId, checkout_type: 'schedule_change' },
      success_url: `${base}/client/requests?schedule_change=success&job_id=${jobId}`,
      cancel_url: `${base}/client/requests?schedule_change=cancelled&job_id=${jobId}`,
    });

    if (db) {
      await db.from('payments').insert({
        id: `pay-schedule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        job_id: jobId,
        amount: amountCents / 100,
        stripe_session_id: session.id,
        status: 'pending',
        payment_method: 'stripe',
      });
    }

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create schedule change checkout session';
    console.error('Schedule change checkout error:', message);
    return res.status(500).json({ error: message });
  }
}
