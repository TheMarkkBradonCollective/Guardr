import type { VercelRequest, VercelResponse } from '@vercel/node';
import { markJobHeld } from '../../_lib/stripeShared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { jobId } = (req.body ?? {}) as { jobId?: string };
  if (!jobId) {
    return res.status(400).json({ error: 'jobId is required' });
  }

  await markJobHeld(jobId);
  return res.status(200).json({ status: 'held' });
}
