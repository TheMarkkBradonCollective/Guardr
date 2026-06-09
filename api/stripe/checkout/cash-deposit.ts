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

  const { jobId, directorEmail, jobTitle, amountCents } = (req.body ?? {}) as {
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

    const db = await getSupabaseAdmin();
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

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create cash deposit checkout';
    console.error('Cash deposit checkout error:', message);
    return res.status(500).json({ error: message });
  }
}
