import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handlePushSend } from '../../lib/push/handlers';
import { withPushHandler } from '../../lib/push/vercelAdapter';
import type { PushSendPayload } from '../../lib/push/types';

function parseBody<T>(req: VercelRequest): T {
  return (req.body ?? {}) as T;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withPushHandler(req, res, ['POST'], async (db, request) =>
    handlePushSend(db, request.headers.authorization, parseBody<PushSendPayload>(request))
  );
}
