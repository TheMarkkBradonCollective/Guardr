import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, rateLimitKey, AUTH_RATE_LIMIT } from '../../lib/rateLimit';

/**
 * Server-side auth bridge: creates a Supabase Auth user and links to profile.
 * Requires service role key. Used for migrating legacy accounts.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
  const limit = checkRateLimit(rateLimitKey(ip, 'auth-bridge'), AUTH_RATE_LIMIT);
  if (!limit.allowed) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }

  const bridgeSecret = process.env.AUTH_BRIDGE_SECRET?.trim();
  if (bridgeSecret) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${bridgeSecret}`) {
      res.status(401).json({ error: 'Unauthorized — auth bridge secret required' });
      return;
    }
  } else if (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY) {
    res.status(503).json({ error: 'Auth bridge secret not configured' });
    return;
  }

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (!url || !serviceKey) {
    res.status(503).json({ error: 'Auth bridge not configured' });
    return;
  }

  const { email, password, profileId, table } = req.body ?? {};
  if (!email || !password || !profileId || !['guards', 'clients', 'staff'].includes(table)) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    res.status(400).json({ error: createError?.message ?? 'Could not create auth user' });
    return;
  }

  const { error: linkError } = await admin
    .from(table)
    .update({ auth_user_id: created.user.id })
    .eq('id', profileId);

  if (linkError) {
    res.status(500).json({ error: linkError.message });
    return;
  }

  res.status(200).json({ authUserId: created.user.id });
}
