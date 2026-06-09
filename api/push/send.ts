import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dispatchPushNotification, type PushSendPayload } from '../../lib/pushApi/pushDelivery';
import { isInternalPushAuthorized, isPushConfigured, withPushDb } from '../../lib/pushApi/pushShared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = Array.isArray(req.headers.authorization)
    ? req.headers.authorization[0]
    : req.headers.authorization;

  return withPushDb(req, res, async (db) => {
    if (!isInternalPushAuthorized(authHeader)) {
      return { status: 401, body: { error: 'Unauthorized internal push secret required' } };
    }

    const body = (req.body ?? {}) as PushSendPayload;
    if (!body.title || !body.body || !body.type) {
      return { status: 400, body: { error: 'title, body, and type are required' } };
    }

    if (!isPushConfigured()) {
      return {
        status: 503,
        body: { error: 'Web Push is not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.' },
      };
    }

    const result = await dispatchPushNotification(db, body);
    return { status: 200, body: { ok: true, ...result } };
  });
}
