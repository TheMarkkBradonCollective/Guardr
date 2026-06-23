import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handlePushEvent } from '../_push/handlers';
import { withPushHandler } from '../_push/vercelAdapter';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withPushHandler(req, res, ['POST'], async (db, request) =>
    handlePushEvent(db, (request.body ?? {}) as Parameters<typeof handlePushEvent>[1])
  );
}
