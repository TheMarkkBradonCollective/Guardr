import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handlePushSend } from '../../server/pushHandlers';
import { runPushHandler } from '../_pushShared';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = Array.isArray(req.headers.authorization)
    ? req.headers.authorization[0]
    : req.headers.authorization;

  return runPushHandler(req, res, (db) => handlePushSend(db, authHeader, req.body ?? {}));
}
