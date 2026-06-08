import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getStripe } from '../../_lib/stripeClient';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe is not configured' });
  }

  const { guardId, email, name } = (req.body ?? {}) as {
    guardId?: string;
    email?: string;
    name?: string;
  };

  if (!guardId || !email) {
    return res.status(400).json({ error: 'guardId and email are required' });
  }

  try {
    const { getSupabaseAdmin } = await import('../../_lib/supabaseAdmin');
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
        capabilities: { transfers: { requested: true } },
        business_type: 'individual',
        ...(name ? { business_profile: { name } } : {}),
      });
      accountId = account.id;

      if (db) {
        await db.from('guards').update({ stripe_connect_account_id: accountId }).eq('id', guardId);
      }
    }

    return res.status(200).json({ accountId });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create Connect account';
    console.error('Connect account error:', message);
    return res.status(500).json({ error: message });
  }
}
