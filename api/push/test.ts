import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dispatchPushNotification } from './pushDelivery';
import {
  getSupabaseAdmin,
  isPushConfigured,
  jsonError,
  verifySession,
} from './pushShared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return jsonError(res, 405, 'Method not allowed');
  }

  try {
    const db = await getSupabaseAdmin();
    if (!db) {
      return jsonError(res, 503, 'Database is not configured');
    }

    if (!isPushConfigured()) {
      return jsonError(
        res,
        503,
        'Web Push is not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY on the server.'
      );
    }

    const body = (req.body ?? {}) as { userId?: string; email?: string; role?: string; siteId?: string };
    const session = await verifySession(db, {
      userId: body.userId ?? '',
      email: body.email ?? '',
      role: body.role ?? '',
    });
    if (!session) {
      return jsonError(res, 401, 'Unauthorized — sign in again and retry');
    }

    const result = await dispatchPushNotification(db, {
      userId: session.userId,
      title: 'Guardr test alert',
      body: 'Push notifications are working. You will receive operational alerts here.',
      type: 'test',
      url: '/',
      siteId: body.siteId,
    });

    return res.status(200).json({ ok: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Push test failed';
    console.error('Push test error:', message, err);
    return jsonError(res, 500, message);
  }
}
