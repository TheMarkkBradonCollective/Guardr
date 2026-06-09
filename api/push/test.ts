import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dispatchPushNotification } from '../../lib/pushApi/pushDelivery';
import { isPushConfigured, verifySession, withPushDb } from '../../lib/pushApi/pushShared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withPushDb(req, res, async (db) => {
    const body = (req.body ?? {}) as {
      userId?: string;
      email?: string;
      role?: string;
      siteId?: string;
    };

    const session = await verifySession(db, {
      userId: body.userId ?? '',
      email: body.email ?? '',
      role: body.role ?? '',
    });

    if (!session) {
      return { status: 401, body: { error: 'Unauthorized invalid session' } };
    }

    if (!isPushConfigured()) {
      return {
        status: 503,
        body: { error: 'Web Push is not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.' },
      };
    }

    const result = await dispatchPushNotification(db, {
      userId: session.userId,
      title: 'Guardr test alert',
      body: 'Push notifications are working. You will receive operational alerts here.',
      type: 'test',
      url: '/',
      siteId: body.siteId,
    });

    return { status: 200, body: { ok: true, ...result } };
  });
}
