import type { SessionUser } from '../types';
import type { PushSubscriptionDto } from './push';

async function parseApiResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) {
    throw new Error(res.ok ? 'Empty server response' : `Server error (${res.status})`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Server returned invalid response: ${text.slice(0, 120)}`);
  }
}

function sessionBody(user: SessionUser, extra: Record<string, unknown> = {}) {
  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    ...extra,
  };
}

export async function subscribePush(
  user: SessionUser,
  subscription: PushSubscriptionDto,
  options?: { siteId?: string; quietHoursStart?: string; quietHoursEnd?: string }
): Promise<void> {
  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sessionBody(user, { subscription, ...options })),
  });
  const data = await parseApiResponse<{ error?: string }>(res);
  if (!res.ok) throw new Error(data.error || 'Failed to subscribe to push notifications');
}

export async function unsubscribePush(user: SessionUser, endpoint?: string): Promise<void> {
  const res = await fetch('/api/push/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sessionBody(user, { endpoint })),
  });
  const data = await parseApiResponse<{ error?: string }>(res);
  if (!res.ok) throw new Error(data.error || 'Failed to unsubscribe from push notifications');
}

export async function sendTestPush(user: SessionUser, siteId?: string): Promise<{ sent: number; failed: number }> {
  const res = await fetch('/api/push/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sessionBody(user, { siteId })),
  });
  const data = await parseApiResponse<{ sent?: number; failed?: number; error?: string }>(res);
  if (!res.ok) throw new Error(data.error || 'Failed to send test notification');
  return { sent: data.sent ?? 0, failed: data.failed ?? 0 };
}

export type PushEventType =
  | 'guard_checkin'
  | 'missed_checkin'
  | 'assignment'
  | 'emergency_alert'
  | 'support_message'
  | 'job_chat_message'
  | 'staff_message';

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
  }
): Promise<void> {
  try {
    const res = await fetch('/api/push/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
