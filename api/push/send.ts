import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handlePushSend } from '../../lib/push/handlers';
import { withPushHandler } from '../../lib/push/vercelAdapter';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withPushHandler(req, res, ['POST'], async (db, request) => {
    const authHeader = Array.isArray(request.headers.authorization)
      ? request.headers.authorization[0]
      : request.headers.authorization;
    return handlePushSend(db, authHeader, (request.body ?? {}) as Parameters<typeof handlePushSend>[2]);
  });
}
