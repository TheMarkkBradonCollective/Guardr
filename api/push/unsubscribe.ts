import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getSupabaseAdmin,
  jsonError,
  removePushSubscription,
  verifySession,
} from '../../lib/pushApi/pushShared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return jsonError(res, 405, 'Method not allowed');
  }

  try {
    const db = await getSupabaseAdmin();
    if (!db) {
      return jsonError(res, 503, 'Database is not configured');
    }

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
      return jsonError(res, 401, 'Unauthorized — sign in again and retry');
    }

    await removePushSubscription(db, session.userId, body.endpoint);
    return res.status(200).json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Push unsubscribe failed';
    console.error('Push unsubscribe error:', message, err);
    return jsonError(res, 500, message);
  }
}
