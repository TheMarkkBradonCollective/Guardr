export const FCM_NATIVE_ENDPOINT_PREFIX = 'fcm-native:';
export const FCM_NATIVE_KEY_PLACEHOLDER = 'native-fcm';

export function isFcmConfigured(): boolean {
  return !!process.env.FCM_SERVER_KEY?.trim();
}

export function isFcmNativeEndpoint(endpoint: string): boolean {
  return endpoint.startsWith(FCM_NATIVE_ENDPOINT_PREFIX);
}

export function fcmTokenFromEndpoint(endpoint: string): string | null {
  if (!isFcmNativeEndpoint(endpoint)) return null;
  const token = endpoint.slice(FCM_NATIVE_ENDPOINT_PREFIX.length).trim();
  return token || null;
}

export function isFcmNativeSubscription(subscription: {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
}): boolean {
  if (!subscription.endpoint || !isFcmNativeEndpoint(subscription.endpoint)) return false;
  return (
    subscription.keys?.p256dh === FCM_NATIVE_KEY_PLACEHOLDER &&
    subscription.keys?.auth === FCM_NATIVE_KEY_PLACEHOLDER
  );
}

export function isValidPushSubscriptionPayload(subscription: {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
}): boolean {
  if (!subscription.endpoint?.trim()) return false;
  if (isFcmNativeSubscription(subscription)) return true;
  const p256dh = subscription.keys?.p256dh?.trim();
  const auth = subscription.keys?.auth?.trim();
  if (!p256dh || !auth) return false;
  if (p256dh === FCM_NATIVE_KEY_PLACEHOLDER || auth === FCM_NATIVE_KEY_PLACEHOLDER) return false;
  return true;
}

type FcmSendResult =
  | { ok: true; statusCode?: undefined; endpoint?: undefined }
  | { ok: false; statusCode?: number; endpoint: string };

function stringifyDataValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

export async function sendFcmNativeNotification(
  endpoint: string,
  payload: Record<string, unknown>,
  attempt = 0
): Promise<FcmSendResult> {
  const serverKey = process.env.FCM_SERVER_KEY?.trim();
  if (!serverKey) return { ok: false, endpoint };

  const token = fcmTokenFromEndpoint(endpoint);
  if (!token) return { ok: false, endpoint };

  const data: Record<string, string> = {};
  const nested = payload.data;
  if (nested && typeof nested === 'object') {
    for (const [key, value] of Object.entries(nested as Record<string, unknown>)) {
      data[key] = stringifyDataValue(value);
    }
  }
  if (payload.url) data.url = stringifyDataValue(payload.url);
  if (payload.eventType) data.eventType = stringifyDataValue(payload.eventType);
  if (payload.priority) data.priority = stringifyDataValue(payload.priority);

  try {
    const res = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        Authorization: `key=${serverKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: token,
        notification: {
          title: String(payload.title ?? 'Guardr'),
          body: String(payload.body ?? ''),
        },
        data,
        priority: payload.priority === 'high' ? 'high' : 'normal',
      }),
    });

    const body = (await res.json().catch(() => ({}))) as {
      success?: number;
      failure?: number;
      results?: Array<{ error?: string }>;
    };

    if (res.ok && body.success === 1) return { ok: true };

    const errCode = body.results?.[0]?.error;
    if (errCode === 'NotRegistered' || errCode === 'InvalidRegistration') {
      return { ok: false, statusCode: 410, endpoint };
    }

    if (attempt < 2 && res.status >= 500) {
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      return sendFcmNativeNotification(endpoint, payload, attempt + 1);
    }

    return { ok: false, statusCode: res.status, endpoint };
  } catch {
    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      return sendFcmNativeNotification(endpoint, payload, attempt + 1);
    }
    return { ok: false, endpoint };
  }
}
