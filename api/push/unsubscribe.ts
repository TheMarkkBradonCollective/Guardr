import type { VercelRequest, VercelResponse } from '@vercel/node';
import { removePushSubscription, verifySession, withPushDb } from '../../lib/pushApi/pushShared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withPushDb(req, res, async (db) => {
    const body = (req.body ?? {}) as {
      userId?: string;
      email?: string;
      role?: string;
      endpoint?: string;
    };

    const session = await verifySession(db, {
      userId: body.userId ?? '',
      email: body.email ?? '',
      role: body.role ?? '',
    });

    if (!session) {
      return { status: 401, body: { error: 'Unauthorized invalid session' } };
    }

    await removePushSubscription(db, session.userId, body.endpoint);
    return { status: 200, body: { ok: true } };
  });
}
