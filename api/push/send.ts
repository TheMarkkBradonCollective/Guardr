import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dispatchPushNotification } from './pushDelivery';
import {
  getSupabaseAdmin,
  isInternalPushAuthorized,
  isPushConfigured,
  jsonError,
  parseRequestBody,
} from './pushShared';
import type { PushSendPayload } from './pushTypes';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return jsonError(res, 405, 'Method not allowed');
  }

  try {
    if (!isInternalPushAuthorized(req.headers.authorization)) {
      return jsonError(res, 401, 'Unauthorized — internal push secret required');
    }

    const body = parseRequestBody(req) as unknown as PushSendPayload;
    if (!body.title || !body.body || !body.type) {
      return jsonError(res, 400, 'title, body, and type are required');
    }

    const db = await getSupabaseAdmin();
    if (!db) {
      return jsonError(res, 503, 'Database is not configured');
    }

    if (!isPushConfigured()) {
      return jsonError(res, 503, 'Web Push is not configured on the server');
    }

    const result = await dispatchPushNotification(db, body);
    return res.status(200).json({ ok: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Push send failed';
    console.error('Push send error:', message, err);
    return jsonError(res, 500, message);
  }
}
