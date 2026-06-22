import type { SessionUser } from '../types';
import { subscribePush } from './pushApi';

const PUSH_ENABLED_KEY = 'guardr_push_enabled';
const VAPID_CACHE_KEY = 'guardr_vapid_public_key';

export const SW_MESSAGE = {
  NOTIFICATION_CLICK: 'NOTIFICATION_CLICK',
  PUSH_SUBSCRIPTION_CHANGED: 'PUSH_SUBSCRIPTION_CHANGED',
  /** @deprecated Use NOTIFICATION_CLICK */
  LEGACY_NAVIGATE: 'guardr-push-navigate',
} as const;

export interface PushSubscriptionDto {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: number | null;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

function readCachedVapidKey(): string | null {
  try {
    const cached = localStorage.getItem(VAPID_CACHE_KEY)?.trim();
    return cached || null;
  } catch {
    return null;
  }
}

function writeCachedVapidKey(key: string): void {
  try {
    localStorage.setItem(VAPID_CACHE_KEY, key);
  } catch {
    /* ignore */
  }
}

/** Sync check: build-time env or localStorage cache from a prior fetch. */
export function getVapidPublicKey(): string | null {
  const envKey = (
    (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_VAPID_PUBLIC_KEY ?? ''
  ).trim();
  if (envKey) return envKey;
  return readCachedVapidKey();
}

/** Fetch VAPID public key from server (SacramentoBuyNothing pattern) and cache locally. */
export async function fetchVapidPublicKey(): Promise<string | null> {
  const envKey = (
    (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_VAPID_PUBLIC_KEY ?? ''
  ).trim();
  if (envKey) return envKey;

  try {
    const res = await fetch('/api/push/vapid-public-key');
    if (!res.ok) return readCachedVapidKey();
    const data = (await res.json()) as { publicKey?: string };
    const key = data.publicKey?.trim();
    if (key) {
      writeCachedVapidKey(key);
      return key;
    }
  } catch {
    /* fall through */
  }
  return readCachedVapidKey();
}

export async function isPushConfigured(): Promise<boolean> {
  const key = await fetchVapidPublicKey();
  return !!key;
}

export function isPushEnabledLocally(): boolean {
  try {
    return localStorage.getItem(PUSH_ENABLED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setPushEnabledLocally(enabled: boolean): void {
  localStorage.setItem(PUSH_ENABLED_KEY, enabled ? 'true' : 'false');
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  return navigator.serviceWorker.register('/service-worker.js');
}

export async function getPushPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestPushPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isPushSupported()) return 'unsupported';
  return Notification.requestPermission();
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function subscribeToPush(): Promise<PushSubscriptionDto | null> {
  const vapidPublicKey = await fetchVapidPublicKey();
  if (!vapidPublicKey) {
    throw new Error('Push notifications are not configured on the server');
  }

  const registration = await registerServiceWorker();
  if (!registration) {
    throw new Error('Service worker is not available');
  }

  const permission = await requestPushPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted');
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error('Failed to create push subscription');
  }

  return {
    endpoint: json.endpoint,
    keys: {
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
    expirationTime: json.expirationTime ?? null,
  };
}

export async function unsubscribeFromPush(): Promise<void> {
  const subscription = await getExistingSubscription();
  if (subscription) {
    await subscription.unsubscribe();
  }
}

export function sessionPayload(user: SessionUser) {
  return {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
}

export function listenForPushNavigation(onNavigate: (url: string) => void): () => void {
  if (!('serviceWorker' in navigator)) return () => undefined;

  const handler = (event: MessageEvent) => {
    const type = event.data?.type;
    const url = event.data?.url;
    if (
      (type === SW_MESSAGE.NOTIFICATION_CLICK || type === SW_MESSAGE.LEGACY_NAVIGATE) &&
      typeof url === 'string'
    ) {
      onNavigate(url);
    }
  };

  navigator.serviceWorker.addEventListener('message', handler);
  return () => navigator.serviceWorker.removeEventListener('message', handler);
}

export function listenForPushSubscriptionChange(onChanged: () => void): () => void {
  if (!('serviceWorker' in navigator)) return () => undefined;

  const handler = (event: MessageEvent) => {
    if (event.data?.type === SW_MESSAGE.PUSH_SUBSCRIPTION_CHANGED) {
      onChanged();
    }
  };

  navigator.serviceWorker.addEventListener('message', handler);
  return () => navigator.serviceWorker.removeEventListener('message', handler);
}

/** Re-sync browser subscription with server after SW rotation (SBN pattern). */
export async function syncPushSubscriptionWithServer(
  user: SessionUser,
  options?: { siteId?: string; quietHoursStart?: string; quietHoursEnd?: string }
): Promise<boolean> {
  if (!isPushEnabledLocally() || Notification.permission !== 'granted') return false;

  const subscription = await subscribeToPush();
  if (!subscription) return false;

  await subscribePush(user, subscription, options);
  return true;
}
