import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getSupabaseAdmin,
  jsonError,
  platformRoleToPushRole,
  upsertPushSubscription,
  verifySession,
} from './_shared';

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
      subscription?: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      siteId?: string;
      quietHoursStart?: string;
      quietHoursEnd?: string;
    };

    const session = await verifySession(db, {
      userId: body.userId ?? '',
      email: body.email ?? '',
      role: body.role ?? '',
    });
    if (!session) {
      return jsonError(res, 401, 'Unauthorized — sign in again and retry');
    }

    const subscription = body.subscription;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return jsonError(res, 400, 'Valid push subscription is required');
    }

    await upsertPushSubscription(db, {
      userId: session.userId,
      pushRole: platformRoleToPushRole(session.platformRole),
      subscription: {
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.keys.p256dh, auth: subscription.keys.auth },
      },
      siteId: body.siteId,
      quietHoursStart: body.quietHoursStart,
      quietHoursEnd: body.quietHoursEnd,
    });

    return res.status(200).json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Push subscribe failed';
    console.error('Push subscribe error:', message, err);
    return jsonError(res, 500, message);
  }
}
