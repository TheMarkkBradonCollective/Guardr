import type { VercelRequest, VercelResponse } from '@vercel/node';
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { getSupabaseAdmin } = await import('../_lib/supabaseAdmin');
  const db = await getSupabaseAdmin();
  if (!db) {
    return res.status(200).json({ payments: [] });
  }

  const { data, error } = await db
    .from('payments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ payments: data ?? [] });
}
