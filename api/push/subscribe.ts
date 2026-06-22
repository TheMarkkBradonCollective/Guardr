import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handlePushSubscribe } from '../../lib/push/handlers';
import { withPushHandler } from '../../lib/push/vercelAdapter';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withPushHandler(req, res, ['POST'], async (db, request) =>
    handlePushSubscribe(db, (request.body ?? {}) as Parameters<typeof handlePushSubscribe>[1])
  );
}
