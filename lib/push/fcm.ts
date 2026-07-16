import { createSign } from 'node:crypto';

export const FCM_NATIVE_ENDPOINT_PREFIX = 'fcm-native:';
export const FCM_NATIVE_KEY_PLACEHOLDER = 'native-fcm';

interface ServiceAccount {
  project_id: string;
  client_email: string;
  private_key: string;
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

function parseServiceAccountJson(): ServiceAccount | null {
  const raw = process.env.FCM_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ServiceAccount>;
    if (parsed.project_id && parsed.client_email && parsed.private_key) {
      return {
        project_id: parsed.project_id,
        client_email: parsed.client_email,
        private_key: parsed.private_key,
      };
    }
  } catch {
    /* ignore invalid JSON */
  }
  return null;
}

export function isFcmConfigured(): boolean {
  return !!process.env.FCM_SERVER_KEY?.trim() || !!parseServiceAccountJson();
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

function buildDataPayload(payload: Record<string, unknown>): Record<string, string> {
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
  return data;
}

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url');
}

async function getFcmAccessToken(serviceAccount: ServiceAccount): Promise<string | null> {
  const now = Date.now();
  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60_000) {
    return cachedAccessToken.token;
  }

  const issuedAt = Math.floor(now / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = base64UrlEncode(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: issuedAt,
      exp: issuedAt + 3600,
    })
  );
  const unsigned = `${header}.${claim}`;
  const sign = createSign('RSA-SHA256');
  sign.update(unsigned);
  const signature = sign.sign(serviceAccount.private_key, 'base64url');
  const assertion = `${unsigned}.${signature}`;

  try {
    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      access_token?: string;
      expires_in?: number;
    };
    if (!res.ok || !body.access_token) return null;
    cachedAccessToken = {
      token: body.access_token,
      expiresAt: now + (body.expires_in ?? 3600) * 1000,
    };
    return body.access_token;
  } catch {
    return null;
  }
}

async function sendFcmV1Notification(
  serviceAccount: ServiceAccount,
  endpoint: string,
  token: string,
  payload: Record<string, unknown>,
  attempt = 0
): Promise<FcmSendResult> {
  const accessToken = await getFcmAccessToken(serviceAccount);
  if (!accessToken) return { ok: false, endpoint };

  const data = buildDataPayload(payload);

  try {
    const res = await fetch(
      `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token,
            notification: {
              title: String(payload.title ?? 'Guardr'),
              body: String(payload.body ?? ''),
            },
            data,
            android: {
              priority: payload.priority === 'high' ? 'high' : 'normal',
              notification: {
                channel_id: 'guardr_alerts',
              },
            },
          },
        }),
      }
    );

    if (res.ok) return { ok: true };

    const body = (await res.json().catch(() => ({}))) as {
      error?: { status?: string; message?: string };
    };
    const errStatus = body.error?.status;
    if (
      errStatus === 'NOT_FOUND' ||
      errStatus === 'UNREGISTERED' ||
      errStatus === 'INVALID_ARGUMENT'
    ) {
      return { ok: false, statusCode: 410, endpoint };
    }

    if (attempt < 2 && res.status >= 500) {
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      return sendFcmV1Notification(serviceAccount, endpoint, token, payload, attempt + 1);
    }

    return { ok: false, statusCode: res.status, endpoint };
  } catch {
    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      return sendFcmV1Notification(serviceAccount, endpoint, token, payload, attempt + 1);
    }
    return { ok: false, endpoint };
  }
}

async function sendFcmLegacyNotification(
  endpoint: string,
  token: string,
  payload: Record<string, unknown>,
  serverKey: string,
  attempt = 0
): Promise<FcmSendResult> {
  const data = buildDataPayload(payload);

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
          android_channel_id: 'guardr_alerts',
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
      return sendFcmLegacyNotification(endpoint, token, payload, serverKey, attempt + 1);
    }

    return { ok: false, statusCode: res.status, endpoint };
  } catch {
    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      return sendFcmLegacyNotification(endpoint, token, payload, serverKey, attempt + 1);
    }
    return { ok: false, endpoint };
  }
}

export async function sendFcmNativeNotification(
  endpoint: string,
  payload: Record<string, unknown>,
  attempt = 0
): Promise<FcmSendResult> {
  const token = fcmTokenFromEndpoint(endpoint);
  if (!token) return { ok: false, endpoint };

  const serviceAccount = parseServiceAccountJson();
  if (serviceAccount) {
    return sendFcmV1Notification(serviceAccount, endpoint, token, payload, attempt);
  }

  const serverKey = process.env.FCM_SERVER_KEY?.trim();
  if (!serverKey) return { ok: false, endpoint };

  return sendFcmLegacyNotification(endpoint, token, payload, serverKey, attempt);
}
