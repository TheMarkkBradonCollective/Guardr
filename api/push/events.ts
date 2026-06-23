import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handlePushEvent } from '../../lib/push/handlers';
import { getSupabaseAdmin, withPushHandler } from '../../lib/push/vercelAdapter';

function parseBody<T>(req: VercelRequest): T {
  return (req.body ?? {}) as T;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withPushHandler(req, res, ['POST'], async (db, request) =>
    handlePushEvent(db, parseBody(request))
  );
}

// Re-export for tree-shaking / explicit db usage in tests
export { getSupabaseAdmin };
