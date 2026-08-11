import type { VercelRequest, VercelResponse } from '@vercel/node';

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

  const { guardId, staffId, email, name } = (req.body ?? {}) as {
    guardId?: string;
    staffId?: string;
    email?: string;
    name?: string;
  };

  const subjectId = staffId ?? guardId;
  if (!subjectId || !email) {
    return res.status(400).json({ error: 'guardId or staffId, plus email, are required' });
  }

  const table = staffId ? 'staff' : 'guards';
  const metadataKey = staffId ? 'staff_id' : 'guard_id';

  try {
    const db = await getSupabaseAdmin();
    let accountId: string | null = null;

    if (db) {
      const { data: row } = await db
        .from(table)
        .select('stripe_connect_account_id')
        .eq('id', subjectId)
        .maybeSingle();
      accountId = row?.stripe_connect_account_id ?? null;
    }

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email,
        metadata: { [metadataKey]: subjectId },
        capabilities: { transfers: { requested: true } },
        business_type: 'individual',
        ...(name ? { business_profile: { name } } : {}),
      });
      accountId = account.id;

      if (db) {
        await db.from(table).update({ stripe_connect_account_id: accountId }).eq('id', subjectId);
      }
    }

    return res.status(200).json({ accountId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create Connect account';
    console.error('Connect account error:', message);

    if (message.includes("signed up for Connect")) {
      const isLive = process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_');
      return res.status(503).json({
        error: isLive
          ? 'Guardr’s Stripe account must finish Connect platform setup before payouts can onboard. In Stripe Dashboard go to Connect → Get started and complete your platform profile (this is separate from webhooks).'
          : 'Enable Stripe Connect in test mode: Stripe Dashboard → switch to Test mode → Connect → Get started, then use your sk_test_ key in Vercel.',
        code: 'connect_platform_not_enabled',
      });
    }

    return res.status(500).json({ error: message });
  }
}
