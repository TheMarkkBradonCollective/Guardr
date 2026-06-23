import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveNotificationUrl } from './routing';
import type { PushSendPayload, PushNotificationType } from './types';

export interface PushEventInput {
  type: PushNotificationType;
  title?: string;
  body?: string;
  guardId?: string;
  requestId?: string;
  siteId?: string;
  guardName?: string;
  location?: string;
  recipientUserId?: string;
  ticketId?: string;
  excludeUserId?: string;
}

const EVENT_DEFAULTS: Record<string, (event: PushEventInput) => { title: string; body: string }> = {
  guard_checkin: (event) => ({
    title: 'Guard check-in',
    body: event.guardName
      ? `${event.guardName} checked in${event.location ? ` at ${event.location}` : ''}`
      : 'A guard completed a check-in',
  }),
  missed_checkin: (event) => ({
    title: 'Missed check-in',
    body: event.guardName
      ? `${event.guardName} missed an hourly check-in`
      : 'A guard missed an hourly check-in',
  }),
  assignment: (event) => ({
    title: 'New assignment',
    body: event.body
      ?? (event.location
        ? `You have a new assignment at ${event.location}`
        : 'You have a new assignment update'),
  }),
  emergency_alert: (event) => ({
    title: 'Emergency alert',
    body: event.body || 'Immediate attention required on an active shift',
  }),
  support_message: (event) => ({
    title: 'Support message',
    body: event.body || 'You have a new support message',
  }),
  job_chat_message: (event) => ({
    title: 'Job chat',
    body: event.body || 'New message on an active job',
  }),
  staff_message: (event) => ({
    title: 'Staff chat',
    body: event.body || 'New message from the Guardr team',
  }),
  guard_message: (event) => ({
    title: 'Guard chat',
    body: event.body || 'New message from another guard',
  }),
  job_submitted: (event) => ({
    title: 'New job request',
    body: event.body || 'A client submitted a job awaiting staff review',
  }),
  guard_application: (event) => ({
    title: 'Guard application',
    body: event.body || 'A guard applied to an open job offer',
  }),
  guard_pending_approval: (event) => ({
    title: 'Guard pending approval',
    body: event.body || 'A guard account needs staff review',
  }),
  client_pending_approval: (event) => ({
    title: 'Client pending approval',
    body: event.body || 'A client account needs staff review',
  }),
  credential_pending: (event) => ({
    title: 'Credential review',
    body: event.body || 'A guard submitted credentials for review',
  }),
  payment_attention: (event) => ({
    title: 'Payment attention',
    body: event.body || 'A payment or payout needs staff action',
  }),
};

function basePayload(event: PushEventInput): PushSendPayload {
  const fallbackFn = EVENT_DEFAULTS[event.type];
  const fallback = fallbackFn
    ? fallbackFn(event)
    : { title: 'Guardr alert', body: event.body || 'Operational update' };

  return {
    title: event.title ?? fallback.title,
    body: event.body ?? fallback.body,
    type: event.type,
    url: resolveNotificationUrl(event.type, {
      guardId: event.guardId,
      requestId: event.requestId,
      ticketId: event.ticketId,
    }),
    guardId: event.guardId,
    requestId: event.requestId,
    ticketId: event.ticketId,
    siteId: event.siteId,
    priority: event.type === 'emergency_alert' ? 'high' : 'normal',
    excludeUserId: event.excludeUserId,
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

/**
 * Build one or more dispatch payloads for a push event.
 */
export async function buildEventDispatchPayloads(
  db: SupabaseClient,
  event: PushEventInput
): Promise<PushSendPayload[]> {
  const payload = basePayload(event);

  if (event.type === 'assignment') {
    if (event.recipientUserId) {
      return [{ ...payload, userId: event.recipientUserId }];
    }
    if (event.guardId) {
      return [{ ...payload, userId: event.guardId }];
    }
    return [{ ...payload, role: 'guard' }];
  }

  if (event.type === 'support_message' && event.recipientUserId) {
    return [{ ...payload, userId: event.recipientUserId }];
  }

  if (event.type === 'job_chat_message' && event.recipientUserId) {
    return [{ ...payload, userId: event.recipientUserId }];
  }

  if (event.type === 'emergency_alert' && event.requestId) {
    const { clientId, guardId } = await loadJobParticipants(db, event.requestId);
    const payloads: PushSendPayload[] = [{ ...payload, role: 'dispatch' }];
    if (guardId) payloads.push({ ...payload, userId: guardId });
    if (clientId) payloads.push({ ...payload, userId: clientId });
    return payloads;
  }

  if (event.type === 'missed_checkin') {
    const payloads: PushSendPayload[] = [{ ...payload, role: 'dispatch' }];
    if (event.guardId) {
      payloads.push({
        ...payload,
        userId: event.guardId,
        title: 'Missed check-in reminder',
        body: event.location
          ? `You missed your hourly check-in at ${event.location}`
          : 'You missed your hourly check-in — please check in now',
      });
    }
    return payloads;
  }

  if (
    event.type === 'staff_message' ||
    event.type === 'job_submitted' ||
    event.type === 'guard_application' ||
    event.type === 'guard_pending_approval' ||
    event.type === 'client_pending_approval' ||
    event.type === 'credential_pending' ||
    event.type === 'payment_attention' ||
    (event.type === 'support_message' && !event.recipientUserId) ||
    (event.type === 'job_chat_message' && !event.recipientUserId)
  ) {
    return [{ ...payload, role: 'dispatch' }];
  }

  if (event.type === 'guard_message') {
    return [{ ...payload, role: 'guard' }];
  }

  if (event.type === 'guard_checkin') {
    return [{ ...payload, role: 'dispatch' }];
  }

  return [payload];
}
