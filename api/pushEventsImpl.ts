import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { PushSendPayload } from './pushTypes';
import { dispatchPushNotification } from './pushDelivery';
import { resolveNotificationUrl } from './pushRouting';
import {
  getSupabaseAdmin,
  isPushConfigured,
  jsonError,
  parseRequestBody,
  verifySession,
} from './pushShared';

interface EventBody {
  userId?: string;
  email?: string;
  role?: string;
  type?: PushSendPayload['type'];
  title?: string;
  body?: string;
  guardId?: string;
  guardName?: string;
  requestId?: string;
  siteId?: string;
  location?: string;
  recipientUserId?: string;
  ticketId?: string;
  clientId?: string;
  priority?: 'normal' | 'high';
}

const EVENT_DEFAULTS: Record<string, (body: EventBody) => { title: string; body: string }> = {
  guard_checkin: (body) => ({
    title: 'Guard check-in',
    body: body.guardName
      ? `${body.guardName} checked in${body.location ? ` at ${body.location}` : ''}`
      : 'A guard completed a check-in',
  }),
  guard_clockout: (body) => ({
    title: 'Guard clock-out',
    body: body.guardName
      ? `${body.guardName} clocked out${body.location ? ` at ${body.location}` : ''}`
      : 'A guard clocked out',
  }),
  guard_break_start: (body) => ({
    title: 'Guard on break',
    body: body.guardName
      ? `${body.guardName} started a break${body.location ? ` at ${body.location}` : ''}`
      : 'A guard started a break',
  }),
  guard_break_end: (body) => ({
    title: 'Guard back on duty',
    body: body.guardName
      ? `${body.guardName} ended break and is back on duty${body.location ? ` at ${body.location}` : ''}`
      : 'A guard ended a break',
  }),
  missed_checkin: (body) => ({
    title: 'Missed check-in',
    body: body.guardName
      ? `${body.guardName} missed an hourly check-in`
      : 'A guard missed an hourly check-in',
  }),
  assignment: (body) => ({
    title: 'New assignment',
    body: body.body
      ?? (body.location
        ? `You have a new assignment at ${body.location}`
        : 'You have a new assignment update'),
  }),
  emergency_alert: (body) => ({
    title: 'Emergency alert',
    body: body.body || 'Immediate attention required on an active shift',
  }),
  support_message: (body) => ({
    title: 'Support message',
    body: body.body || 'You have a new support message',
  }),
  job_chat_message: (body) => ({
    title: 'Job chat',
    body: body.body || 'New message on an active job',
  }),
  staff_message: (body) => ({
    title: 'Staff chat',
    body: body.body || 'New message from the Guardr team',
  }),
  guard_message: (body) => ({
    title: 'Guard chat',
    body: body.body || 'New message from another guard',
  }),
  job_submitted: (body) => ({
    title: 'New job request',
    body: body.body || 'A client submitted a job awaiting staff review',
  }),
  guard_application: (body) => ({
    title: 'Guard application',
    body: body.body || 'A guard applied to an open job offer',
  }),
  guard_pending_approval: (body) => ({
    title: 'Guard pending approval',
    body: body.body || 'A guard account needs staff review',
  }),
  client_pending_approval: (body) => ({
    title: 'Client pending approval',
    body: body.body || 'A client account needs staff review',
  }),
  credential_pending: (body) => ({
    title: 'Credential review',
    body: body.body || 'A guard submitted credentials for review',
  }),
  payment_attention: (body) => ({
    title: 'Payment attention',
    body: body.body || 'A payment or payout needs staff action',
  }),
  support_ticket: (body) => ({
    title: 'Support ticket',
    body: body.body || 'A new support ticket needs staff attention',
  }),
  support_ticket_status: (body) => ({
    title: 'Support update',
    body: body.body || 'Your support ticket status changed',
  }),
  dispute_update: (body) => ({
    title: 'Dispute update',
    body: body.body || 'A dispute needs your attention',
  }),
};

function basePayload(
  body: EventBody,
  resolveNotificationUrl: (type: PushSendPayload['type'], options: { guardId?: string; requestId?: string; ticketId?: string }) => string
): PushSendPayload {
  const fallbackFn = body.type ? EVENT_DEFAULTS[body.type] : undefined;
  const fallback = fallbackFn
    ? fallbackFn(body)
    : { title: 'Guardr alert', body: body.body || 'Operational update' };

  return {
    title: body.title ?? fallback.title,
    body: body.body ?? fallback.body,
    type: body.type!,
    url: resolveNotificationUrl(body.type!, {
      guardId: body.guardId,
      requestId: body.requestId,
      ticketId: body.ticketId,
    }),
    guardId: body.guardId,
    requestId: body.requestId,
    ticketId: body.ticketId,
    siteId: body.siteId,
    priority: body.type === 'emergency_alert' ? 'high' : body.priority ?? 'normal',
    excludeUserId: body.type === 'guard_message' || body.type === 'staff_message' ? body.userId : undefined,
  };
}

async function loadJobParticipants(
  db: SupabaseClient,
  requestId: string
): Promise<{ clientId: string | null; guardId: string | null }> {
  const { data } = await db
    .from('security_requests')
    .select('client_id, assigned_guard_id')
    .eq('id', requestId)
    .maybeSingle();

  return {
    clientId: data?.client_id ?? null,
    guardId: data?.assigned_guard_id ?? null,
  };
}

async function buildEventDispatchPayloads(
  db: SupabaseClient,
  body: EventBody,
  resolveNotificationUrl: (type: PushSendPayload['type'], options: { guardId?: string; requestId?: string; ticketId?: string }) => string
): Promise<PushSendPayload[]> {
  const payload = basePayload(body, resolveNotificationUrl);

  switch (body.type) {
    case 'assignment':
      if (body.recipientUserId) return [{ ...payload, userId: body.recipientUserId }];
      if (body.guardId) return [{ ...payload, userId: body.guardId }];
      return [{ ...payload, role: 'guard' }];
    case 'support_message':
      if (body.recipientUserId) return [{ ...payload, userId: body.recipientUserId }];
      return [{ ...payload, role: 'dispatch' }];
    case 'job_chat_message':
      if (body.recipientUserId) return [{ ...payload, userId: body.recipientUserId }];
      return [{ ...payload, role: 'dispatch' }];
    case 'emergency_alert':
      if (!body.requestId) return [{ ...payload, role: 'dispatch' }];
      {
        const { clientId, guardId } = await loadJobParticipants(db, body.requestId);
        const payloads: PushSendPayload[] = [{ ...payload, role: 'dispatch' }];
        if (guardId) payloads.push({ ...payload, userId: guardId });
        if (clientId) payloads.push({ ...payload, userId: clientId });
        return payloads;
      }
    case 'missed_checkin': {
      const payloads: PushSendPayload[] = [{ ...payload, role: 'dispatch' }];
      if (body.guardId) {
        payloads.push({
          ...payload,
          userId: body.guardId,
          title: 'Missed check-in reminder',
          body: body.location
            ? `You missed your hourly check-in at ${body.location}`
            : 'You missed your hourly check-in — please check in now',
        });
      }
      return payloads;
    }
    case 'support_ticket_status':
      if (body.recipientUserId) return [{ ...payload, userId: body.recipientUserId }];
      return [{ ...payload, role: 'dispatch' }];
    case 'support_ticket':
      return [{ ...payload, role: 'dispatch' }];
    case 'dispute_update': {
      const payloads: PushSendPayload[] = [{ ...payload, role: 'dispatch' }];
      if (body.guardId) payloads.push({ ...payload, userId: body.guardId });
      if (body.clientId) payloads.push({ ...payload, userId: body.clientId });
      else if (body.recipientUserId) payloads.push({ ...payload, userId: body.recipientUserId });
      return payloads;
    }
    case 'guard_message':
      return [{ ...payload, role: 'guard' }];
    case 'guard_checkin':
    case 'guard_clockout':
    case 'guard_break_start':
    case 'guard_break_end':
      return [{ ...payload, role: 'dispatch' }];
    case 'staff_message':
    case 'job_submitted':
    case 'guard_application':
    case 'guard_pending_approval':
    case 'client_pending_approval':
    case 'credential_pending':
    case 'payment_attention':
      return [{ ...payload, role: 'dispatch' }];
    default:
      return [payload];
  }
}

export async function handlePushEvents(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return jsonError(res, 405, 'Method not allowed');
  }

  try {
    const db = await getSupabaseAdmin();
    if (!db) {
      return jsonError(res, 503, 'Database is not configured');
    }

    const body = parseRequestBody(req) as EventBody;

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

    const payloads = await buildEventDispatchPayloads(db, body, resolveNotificationUrl);
    let sent = 0;
    let failed = 0;
    for (const payload of payloads) {
      const result = await dispatchPushNotification(db, payload);
      sent += result.sent;
      failed += result.failed;
    }

    return res.status(200).json({ ok: true, sent, failed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Push event failed';
    console.error('Push event error:', message, err);
    return jsonError(res, 500, message);
  }
}
