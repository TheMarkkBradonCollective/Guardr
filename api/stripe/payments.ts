import { getSupabaseAdmin } from '../../lib/db/adminClient.ts';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  verifyFinanceStaffSession,
  type SessionCredentials,
} from '../../lib/accountSessionAuth';
import { parseSessionCredentials } from '../../lib/apiRequestSession';


export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const db = await getSupabaseAdmin();
  if (!db) {
    return res.status(503).json({ error: 'Database is not configured' });
  }

  const credentials = parseSessionCredentials(req) as SessionCredentials | null;
  const session = await verifyFinanceStaffSession(db, credentials);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized — finance staff sign-in required' });
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
