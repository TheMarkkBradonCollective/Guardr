import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handlePushSubscribe } from '../../server/pushHandlers';
import { runPushHandler } from '../_pushShared';

export default function handler(req: VercelRequest, res: VercelResponse) {
  return runPushHandler(req, res, (db) => handlePushSubscribe(db, req.body ?? {}));
}
