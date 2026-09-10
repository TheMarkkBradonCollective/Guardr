import { apiUrl } from './siteConfig';
import type { SessionUser } from '../types';
import { isPushEnabledLocally, setPushEnabledLocally } from './pushLocalState';
import { subscribePush } from './pushApi';
import {
  getNativePushPermission,
  getStoredNativePushSubscription,
  initNativePushBridge,
  isNativePushPlatform,
  listenForNativePushNavigation,
  restoreNativePushIfEnabled,
  resolveNativePushToggleState,
  syncNativePushLocalState,
  subscribeToNativePush,
  unsubscribeFromNativePush,
} from './nativePush';

export {
  isNativePushPlatform,
  isNativeFcmConfigured,
  NATIVE_FCM_NOT_CONFIGURED_MESSAGE,
  resolveNativePushToggleState,
  syncNativePushLocalState,
} from './nativePush';
export { isPushEnabledLocally, setPushEnabledLocally } from './pushLocalState';

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

export function isWebPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function isPushSupported(): boolean {
  return isWebPushSupported() || isNativePushPlatform();
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
    const res = await fetch(apiUrl('/api/push/vapid-public-key'));
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
  if (isNativePushPlatform()) return true;
  const key = await fetchVapidPublicKey();
  return !!key;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (isNativePushPlatform() || !('serviceWorker' in navigator)) return null;
  return navigator.serviceWorker.register('/service-worker.js', { updateViaCache: 'none' });
}

export async function getPushPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (isNativePushPlatform()) return getNativePushPermission();
  if (!isWebPushSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestPushPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (isNativePushPlatform()) {
    const { requestNativePushPermission } = await import('./nativePush');
    return requestNativePushPermission();
  }
  if (!isWebPushSupported()) return 'unsupported';
  return Notification.requestPermission();
}

export async function getExistingPushSubscription(): Promise<PushSubscriptionDto | null> {
  if (isNativePushPlatform()) {
    return getStoredNativePushSubscription();
  }
  if (!isWebPushSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return null;
  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return null;
  return {
    endpoint: json.endpoint,
    keys: {
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
    expirationTime: json.expirationTime ?? null,
  };
}

/** @deprecated Use getExistingPushSubscription */
export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (isNativePushPlatform() || !isWebPushSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

export async function subscribeToPush(): Promise<PushSubscriptionDto | null> {
  if (isNativePushPlatform()) {
    return subscribeToNativePush();
  }

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
  if (isNativePushPlatform()) {
    await unsubscribeFromNativePush();
    return;
  }
  if (!isWebPushSupported()) return;
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
  const cleanups: Array<() => void> = [];

  if (isNativePushPlatform()) {
    cleanups.push(listenForNativePushNavigation(onNavigate));
  }

  if ('serviceWorker' in navigator) {
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
    cleanups.push(() => navigator.serviceWorker.removeEventListener('message', handler));
  }

  return () => {
    for (const cleanup of cleanups) cleanup();
  };
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
  options?: { siteId?: string; quietHoursStart?: string; quietHoursEnd?: string; appChannel?: 'main' | 'messenger' }
): Promise<boolean> {
  if (!isPushEnabledLocally()) return false;

  const permission = await getPushPermission();
  if (permission !== 'granted') return false;

  const subscription = await subscribeToPush();
  if (!subscription) return false;

  await subscribePush(user, subscription, options);
  return true;
}

export function initNativePushListeners(): () => void {
  if (!isNativePushPlatform()) return () => undefined;
  initNativePushBridge();
  return () => undefined;
}
