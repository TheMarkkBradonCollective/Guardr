import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handlePushVapidPublicKey } from '../../lib/push/handlers';
import { withPushHandler } from '../../lib/push/vercelAdapter';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withPushHandler(req, res, ['GET'], async () => handlePushVapidPublicKey());
}
