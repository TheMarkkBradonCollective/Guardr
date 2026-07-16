import type { VercelRequest, VercelResponse } from '@vercel/node';

function getSiteUrl(): string {
  const configured = process.env.APP_URL?.trim().replace(/\/$/, '');
  if (configured) return configured;
  return process.env.VERCEL ? 'https://www.guardr.co' : 'http://localhost:3000';
}

function squareConfigured(): boolean {
  const token = process.env.SQUARE_ACCESS_TOKEN?.trim();
  const locationId = process.env.SQUARE_LOCATION_ID?.trim();
  return !!token && token !== 'sq0atp_placeholder' && !!locationId;
}

function squareApiBase(): string {
  const env = (process.env.SQUARE_ENVIRONMENT || 'production').toLowerCase();
  return env === 'sandbox' ? 'https://connect.squareupsandbox.com' : 'https://connect.squareup.com';
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

  if (!squareConfigured()) {
    return res.status(503).json({ error: 'Square is not configured' });
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
      const { data: settings } = await db
        .from('platform_settings')
        .select('payment_square_enabled')
        .eq('id', 'default')
        .maybeSingle();

      if (settings && settings.payment_square_enabled === false) {
        return res.status(400).json({ error: 'Square card payments are not enabled on this platform' });
      }

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

    const siteUrl = getSiteUrl();
    const locationId = process.env.SQUARE_LOCATION_ID!.trim();
    const response = await fetch(`${squareApiBase()}/v2/online-checkout/payment-links`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-12-18',
      },
      body: JSON.stringify({
        idempotency_key: `job-${jobId}-${Date.now()}`,
        quick_pay: {
          name: jobTitle || `Guardr job ${jobId}`,
          price_money: {
            amount: amountCents,
            currency: 'USD',
          },
          location_id: locationId,
        },
        checkout_options: {
          redirect_url: `${siteUrl}/client/jobs?paid=${jobId}&processor=square`,
        },
        pre_populated_data: {
          buyer_email: clientEmail,
        },
      }),
    });

    const payload = (await response.json()) as {
      payment_link?: { url?: string; id?: string };
      errors?: Array<{ detail?: string }>;
    };

    if (!response.ok || !payload.payment_link?.url) {
      const detail = payload.errors?.[0]?.detail || 'Square checkout failed';
      return res.status(502).json({ error: detail });
    }

    return res.status(200).json({
      url: payload.payment_link.url,
      paymentLinkId: payload.payment_link.id,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Square checkout failed';
    return res.status(500).json({ error: message });
  }
}
