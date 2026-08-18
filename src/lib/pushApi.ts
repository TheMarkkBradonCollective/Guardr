import { apiUrl } from './siteConfig';
import type { SessionUser } from '../types';
import type { PushSubscriptionDto } from './push';
import { inboxPayloadFromPushEvent, persistInboxNotification } from './inboxPersistBridge';

export async function parseApiResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    throw new Error(res.ok ? 'Empty server response' : `Server error (${res.status})`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    const compact = text.replace(/\s+/g, ' ').trim();
    if (compact.includes('FUNCTION_INVOCATION_FAILED')) {
      throw new Error(
        'Push server is temporarily unavailable. Please try again in a moment — if this persists, contact support.'
      );
    }
    if (!res.ok) {
      try {
        const errBody = JSON.parse(text) as { error?: string };
        if (errBody.error) throw new Error(errBody.error);
      } catch (parseErr) {
        if (parseErr instanceof Error && parseErr.message !== compact) throw parseErr;
      }
      throw new Error(`Server error (${res.status})`);
    }
    throw new Error(compact.length > 160 ? `${compact.slice(0, 160)}…` : compact);
  }
}

export function sessionBody(user: SessionUser, extra: Record<string, unknown> = {}) {
  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    ...extra,
  };
}

const MAX_PUSH_RETRIES = 2;
const PUSH_RETRY_DELAY_MS = 400;

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = MAX_PUSH_RETRIES
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(url, init);
      if (res.ok || res.status < 500 || attempt === retries) {
        return res;
      }
      await sleep(PUSH_RETRY_DELAY_MS * (attempt + 1));
    } catch (err) {
      lastError = err;
      if (attempt === retries) {
        if (err instanceof TypeError && /failed to fetch/i.test(err.message)) {
          throw new Error(
            'Could not reach the Guardr server. Check your connection or update the app from guardr.co/download.'
          );
        }
        throw err;
      }
      await sleep(PUSH_RETRY_DELAY_MS * (attempt + 1));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Push request failed');
}

export async function subscribePush(
  user: SessionUser,
  subscription: PushSubscriptionDto,
  options?: { siteId?: string; quietHoursStart?: string; quietHoursEnd?: string }
): Promise<void> {
  const res = await fetchWithRetry(apiUrl('/api/push/subscribe'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify(sessionBody(user, { subscription, ...options })),
  });
  const data = await parseApiResponse<{ error?: string }>(res);
  if (!res.ok) throw new Error(data.error || 'Failed to subscribe to push notifications');
}

export async function unsubscribePush(user: SessionUser, endpoint?: string): Promise<void> {
  const res = await fetchWithRetry(apiUrl('/api/push/unsubscribe'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
    body: JSON.stringify(sessionBody(user, { endpoint })),
  });
  const data = await parseApiResponse<{ error?: string }>(res);
  if (!res.ok) throw new Error(data.error || 'Failed to unsubscribe from push notifications');
}

export async function sendTestPush(user: SessionUser, siteId?: string): Promise<{ sent: number; failed: number }> {
  const res = await fetchWithRetry(apiUrl('/api/push/test'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sessionBody(user, { siteId })),
  });
  const data = await parseApiResponse<{ sent?: number; failed?: number; error?: string }>(res);
  if (!res.ok) throw new Error(data.error || 'Failed to send test notification');
  return { sent: data.sent ?? 0, failed: data.failed ?? 0 };
}

export async function sendBroadcastPush(
  user: SessionUser,
  input: { title?: string; body: string }
): Promise<{ sent: number; failed: number; inbox: number }> {
  const res = await fetchWithRetry(apiUrl('/api/push/test'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(
      sessionBody(user, { broadcast: true, title: input.title, body: input.body })
    ),
  });
  const data = await parseApiResponse<{
    sent?: number;
    failed?: number;
    inbox?: number;
    error?: string;
  }>(res);
  if (!res.ok) throw new Error(data.error || 'Failed to broadcast');
  return { sent: data.sent ?? 0, failed: data.failed ?? 0, inbox: data.inbox ?? 0 };
}

export type PushEventType =
  | 'guard_checkin'
  | 'guard_clockout'
  | 'guard_arrived'
  | 'guard_en_route'
  | 'guard_break_start'
  | 'guard_break_end'
  | 'guard_left_site'
  | 'missed_checkin'
  | 'assignment'
  | 'emergency_alert'
  | 'support_message'
  | 'job_chat_message'
  | 'staff_message'
  | 'guard_message'
  | 'client_message'
  | 'job_submitted'
  | 'job_open_to_guards'
  | 'guard_application'
  | 'guard_pending_approval'
  | 'client_pending_approval'
  | 'credential_pending'
  | 'payment_attention'
  | 'client_invoice_ready'
  | 'client_cash_payment_requested'
  | 'guard_cash_payout_requested'
  | 'stripe_payment_complete'
  | 'support_ticket'
  | 'support_ticket_status'
  | 'dispute_update'
  | 'guard_trusted_status'
  | 'client_trusted_status'
  | 'job_relisted'
  | 'job_schedule_changed'
  | 'team_chat_message'
  | 'account_update'
  | 'job_status_update'
  | 'payout_ready'
  | 'standing_crew_invite'
  | 'company_placard_expiry'
  | 'pre_shift_briefing'
  | 'crew_lead_request'
  | 'test';

export async function reportPushEvent(
  user: SessionUser,
  event: {
    type: PushEventType;
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
    checkinEscalationTier?: 'alert' | 'staff' | 'escalate';
    checkinDueBucket?: number;
    url?: string;
  }
): Promise<void> {
  const inboxPayload = inboxPayloadFromPushEvent(event);
  if (inboxPayload) persistInboxNotification(inboxPayload);

  try {
    const res = await fetchWithRetry(apiUrl('/api/push/events'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify(sessionBody(user, event)),
    });
    if (!res.ok) {
      const data = await parseApiResponse<{ error?: string }>(res);
      console.warn('Push event failed:', data.error);
    }
  } catch (err) {
    console.warn('Push event error:', err);
  }
}
