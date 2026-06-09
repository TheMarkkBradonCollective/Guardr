import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handlePushTest } from '../../lib/push/handlers';
import { runPushHandler } from '../_pushShared';

export default function handler(req: VercelRequest, res: VercelResponse) {
  return runPushHandler(req, res, (db) => handlePushTest(db, req.body ?? {}));
}
