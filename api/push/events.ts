import type { VercelRequest, VercelResponse } from '@vercel/node';
import { resolveNotificationUrl } from '../../lib/push/routing';
import {
  getSupabaseAdmin,
  isPushConfigured,
  jsonError,
  verifySession,
} from '../../lib/pushApi/pushShared';
import type { PushSendPayload } from '../../lib/push/types';

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
      type?: PushSendPayload['type'];
      title?: string;
      body?: string;
      guardId?: string;
      requestId?: string;
      siteId?: string;
      guardName?: string;
      location?: string;
      recipientUserId?: string;
      ticketId?: string;
    };

    const session = await verifySession(db, {
      userId: body.userId ?? '',
      email: body.email ?? '',
      role: body.role ?? '',
    });
    if (!session) {
      return jsonError(res, 401, 'Unauthorized — sign in again and retry');
    }

    if (!body.type) {
      return jsonError(res, 400, 'Notification type is required');
    }

    if (!isPushConfigured()) {
      return jsonError(res, 503, 'Web Push is not configured on the server');
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
      support_message: {
        title: 'Support message',
        body: body.body || 'You have a new support message',
      },
      job_chat_message: {
        title: 'Job chat',
        body: body.body || 'New message on an active job',
      },
      staff_message: {
        title: 'Staff team chat',
        body: body.body || 'New message from the Guardr team',
      },
    };

    const fallback = defaults[body.type] ?? { title: 'Guardr alert', body: body.body || 'Operational update' };
    const url = resolveNotificationUrl(body.type, {
      guardId: body.guardId,
      requestId: body.requestId,
      ticketId: body.ticketId,
    });

    const dispatchPayload: PushSendPayload = {
      title: body.title ?? fallback.title,
      body: body.body ?? fallback.body,
      type: body.type,
      url,
      guardId: body.guardId,
      requestId: body.requestId,
      ticketId: body.ticketId,
      siteId: body.siteId,
      priority: body.type === 'emergency_alert' ? 'high' : 'normal',
    };

    if (body.type === 'assignment' && body.guardId) {
      dispatchPayload.userId = body.guardId;
    } else if (body.type === 'support_message' && body.recipientUserId) {
      dispatchPayload.userId = body.recipientUserId;
    } else if (body.type === 'job_chat_message' && body.recipientUserId) {
      dispatchPayload.userId = body.recipientUserId;
    } else if (body.type === 'staff_message') {
      dispatchPayload.role = 'dispatch';
    }

    const { dispatchPushNotification } = await import('../../lib/push/delivery');
    const result = await dispatchPushNotification(db, dispatchPayload);
    return res.status(200).json({ ok: true, ...result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Push event failed';
    console.error('Push event error:', message, err);
    return jsonError(res, 500, message);
  }
}
