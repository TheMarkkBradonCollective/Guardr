import type { VercelRequest, VercelResponse } from '../../../types.ts';
import { applyApiCors } from '../apiCors';
import { handlePushVapidPublicKey } from '../handlers';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (applyApiCors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const result = handlePushVapidPublicKey();
  return res.status(result.status).json(result.body);
}
