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

  if (!jobId || !clientEmail || !amountCents) {
    return res.status(400).json({ error: 'jobId, clientEmail, and amountCents are required' });
  }

  try {
    const db = await getSupabaseAdmin();
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
      success_url: `${base}/client/requests?payment=success&job_id=${jobId}`,
      cancel_url: `${base}/client/requests?payment=cancelled&job_id=${jobId}`,
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

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create checkout session';
    console.error('Checkout session error:', message);
    return res.status(500).json({ error: message });
  }
}
