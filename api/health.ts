import type { VercelRequest, VercelResponse } from '@vercel/node';
import { isFcmConfigured } from '../lib/push/fcm';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  const hasVapid = !!(
    process.env.VAPID_PUBLIC_KEY?.trim() && process.env.VAPID_PRIVATE_KEY?.trim()
  );

  return res.status(200).json({
    status: 'ok',
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_placeholder',
    hasSupabase: !!(supabaseUrl && supabaseKey),
    hasPush: hasVapid || isFcmConfigured(),
    hasVapid,
    hasFcm: isFcmConfigured(),
  });
}
