import type { VercelRequest, VercelResponse } from '@vercel/node';
import { dispatchPushNotification, type PushNotificationType } from '../../lib/pushApi/pushDelivery';
import { isPushConfigured, verifySession, withPushDb } from '../../lib/pushApi/pushShared';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return withPushDb(req, res, async (db) => {
    const body = (req.body ?? {}) as {
      userId?: string;
      email?: string;
      role?: string;
      type?: PushNotificationType;
      title?: string;
      body?: string;
      guardId?: string;
      requestId?: string;
      siteId?: string;
      guardName?: string;
      location?: string;
    };

    const session = await verifySession(db, {
      userId: body.userId ?? '',
      email: body.email ?? '',
      role: body.role ?? '',
    });

    if (!session) {
      return { status: 401, body: { error: 'Unauthorized invalid session' } };
    }

    if (!body.type) {
      return { status: 400, body: { error: 'Notification type is required' } };
    }

    if (!isPushConfigured()) {
      return {
        status: 503,
        body: { error: 'Web Push is not configured. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY.' },
      };
    }

    const defaults: Record<string, { title: string; body: string }> = {
      guard_checkin: {
        title: 'Guard check-in',
        body: body.guardName
          ? `${body.guardName} checked in${body.location ? ` at ${body.location}` : ''}`
          : 'A guard completed a check-in',
      },
      missed_checkin: {
        title: 'Missed check-in',
        body: body.guardName
          ? `${body.guardName} missed an hourly check-in`
          : 'A guard missed an hourly check-in',
      },
      assignment: {
        title: 'New assignment',
        body: body.location
          ? `You have a new assignment at ${body.location}`
          : 'You have a new assignment update',
      },
      emergency_alert: {
        title: 'Emergency alert',
        body: body.body || 'Immediate attention required on an active shift',
      },
    };

    const fallback = defaults[body.type] ?? {
      title: 'Guardr alert',
      body: body.body || 'Operational update',
    };

    const result = await dispatchPushNotification(db, {
      userId: body.type === 'assignment' ? body.guardId : undefined,
      title: body.title ?? fallback.title,
      body: body.body ?? fallback.body,
      type: body.type,
      guardId: body.guardId,
      requestId: body.requestId,
      siteId: body.siteId,
      priority: body.type === 'emergency_alert' ? 'high' : 'normal',
    });

    return { status: 200, body: { ok: true, ...result } };
  });
}
