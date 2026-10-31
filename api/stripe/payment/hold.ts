import { getSupabaseAdmin } from '../../../lib/db/adminClient.ts';
import type { VercelRequest, VercelResponse } from '@vercel/node';


export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { jobId } = (req.body ?? {}) as { jobId?: string };
  if (!jobId) {
    return res.status(400).json({ error: 'jobId is required' });
  }

  const db = await getSupabaseAdmin();
  if (db) {
    await db.from('security_requests').update({ payment_status: 'held' }).eq('id', jobId);
    await db
      .from('payments')
      .update({ status: 'held', updated_at: new Date().toISOString() })
      .eq('job_id', jobId)
      .in('status', ['paid']);
  }

  return res.status(200).json({ status: 'held' });
}
