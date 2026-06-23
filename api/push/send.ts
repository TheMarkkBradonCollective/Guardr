import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handlePushSend } from '../_push/handlers';
import { withPushHandler } from '../_push/vercelAdapter';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withPushHandler(req, res, ['POST'], async (db, request) => {
    const authHeader = Array.isArray(request.headers.authorization)
      ? request.headers.authorization[0]
      : request.headers.authorization;
    return handlePushSend(db, authHeader, (request.body ?? {}) as Parameters<typeof handlePushSend>[2]);
  });
}
