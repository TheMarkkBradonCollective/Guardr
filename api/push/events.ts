import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handlePushEvent } from '../../lib/push/handlers';
import { withPushHandler } from '../../lib/push/vercelAdapter';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withPushHandler(req, res, ['POST'], async (db, request) =>
    handlePushEvent(db, (request.body ?? {}) as Parameters<typeof handlePushEvent>[1])
  );
}
