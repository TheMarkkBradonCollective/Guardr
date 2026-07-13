import { Capacitor } from '@capacitor/core';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
} from '@capacitor/push-notifications';
import type { PushSubscriptionDto } from './push';
import { isPushEnabledLocally } from './pushLocalState';

export const FCM_NATIVE_ENDPOINT_PREFIX = 'fcm-native:';
const NATIVE_PUSH_TOKEN_KEY = 'guardr_native_push_token';

type PendingRegistration = {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
};

let bridgeInstalled = false;
let pendingRegistration: PendingRegistration | null = null;

export function isNativePushPlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export function isFcmNativeEndpoint(endpoint: string): boolean {
  return endpoint.startsWith(FCM_NATIVE_ENDPOINT_PREFIX);
}

export function fcmEndpointFromToken(token: string): string {
  return `${FCM_NATIVE_ENDPOINT_PREFIX}${token}`;
}

export function fcmTokenFromEndpoint(endpoint: string): string | null {
  if (!isFcmNativeEndpoint(endpoint)) return null;
  const token = endpoint.slice(FCM_NATIVE_ENDPOINT_PREFIX.length).trim();
  return token || null;
}

export function nativePushSubscriptionFromToken(token: string): PushSubscriptionDto {
  return {
    endpoint: fcmEndpointFromToken(token),
    keys: { p256dh: 'native-fcm', auth: 'native-fcm' },
    expirationTime: null,
  };
}

export function getStoredNativePushToken(): string | null {
  try {
    return localStorage.getItem(NATIVE_PUSH_TOKEN_KEY)?.trim() || null;
  } catch {
    return null;
  }
}

export function setStoredNativePushToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(NATIVE_PUSH_TOKEN_KEY, token);
    else localStorage.removeItem(NATIVE_PUSH_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function getStoredNativePushSubscription(): PushSubscriptionDto | null {
  const token = getStoredNativePushToken();
  return token ? nativePushSubscriptionFromToken(token) : null;
}

/** True when OS permission is granted and we have a stored FCM token + local opt-in. */
export function isNativePushActive(
  permission: NotificationPermission | 'unsupported',
  token: string | null = getStoredNativePushToken()
): boolean {
  return permission === 'granted' && !!token && isPushEnabledLocally();
}

function resolveNotificationUrl(rawUrl: unknown): string {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) return '/';
  try {
    const parsed = new URL(rawUrl, 'https://guardr.co');
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return rawUrl.startsWith('/') ? rawUrl : '/';
  }
}

function settlePendingRegistration(token: string): void {
  setStoredNativePushToken(token);
  pendingRegistration?.resolve(token);
  pendingRegistration = null;
}

function rejectPendingRegistration(error: Error): void {
  pendingRegistration?.reject(error);
  pendingRegistration = null;
}

/** Install permanent FCM listeners once — never removed on unsubscribe. */
export function initNativePushBridge(): void {
  if (!isNativePushPlatform() || bridgeInstalled) return;
  bridgeInstalled = true;

  void PushNotifications.addListener('registration', (event: Token) => {
    if (!event.value?.trim()) return;
    settlePendingRegistration(event.value.trim());
  });

  void PushNotifications.addListener('registrationError', (event: { error: string }) => {
    rejectPendingRegistration(new Error(event.error || 'Push registration failed'));
  });

  void PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
    console.info('[native-push] received', notification.title ?? notification.id);
  });
}

export async function getNativePushPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNativePushPlatform()) return 'unsupported';
  const status = await PushNotifications.checkPermissions();
  if (status.receive === 'granted') return 'granted';
  if (status.receive === 'denied') return 'denied';
  return 'default';
}

export async function requestNativePushPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (!isNativePushPlatform()) return 'unsupported';
  const status = await PushNotifications.requestPermissions();
  if (status.receive === 'granted') return 'granted';
  if (status.receive === 'denied') return 'denied';
  return 'default';
}

export async function waitForNativePushRegistration(timeoutMs = 20000): Promise<string> {
  if (!isNativePushPlatform()) {
    throw new Error('Native push is only available in the Guardr app');
  }

  initNativePushBridge();

  const existing = getStoredNativePushToken();
  if (existing) return existing;

  return new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (pendingRegistration) {
        pendingRegistration = null;
        reject(
          new Error(
            'Could not register for push notifications. Ensure google-services.json is configured for the Android build.'
          )
        );
      }
    }, timeoutMs);

    pendingRegistration = {
      resolve: (token) => {
        clearTimeout(timeout);
        resolve(token);
      },
      reject: (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    };

    void PushNotifications.register().catch((error: unknown) => {
      clearTimeout(timeout);
      pendingRegistration = null;
      reject(error instanceof Error ? error : new Error('Push registration failed'));
    });
  });
}

export async function restoreNativePushIfEnabled(): Promise<void> {
  if (!isNativePushPlatform() || !isPushEnabledLocally()) return;

  const permission = await getNativePushPermission();
  if (permission !== 'granted') return;

  try {
    await waitForNativePushRegistration(12000);
  } catch (error) {
    console.warn('[native-push] restore on launch failed:', error);
  }
}

export async function resolveNativePushToggleState(): Promise<{
  permission: NotificationPermission | 'unsupported';
  enabled: boolean;
  subscription: PushSubscriptionDto | null;
}> {
  if (!isNativePushPlatform()) {
    return { permission: 'unsupported', enabled: false, subscription: null };
  }

  initNativePushBridge();

  const permission = await getNativePushPermission();
  let token = getStoredNativePushToken();

  if (permission === 'granted' && isPushEnabledLocally() && !token) {
    try {
      token = await waitForNativePushRegistration(12000);
    } catch (error) {
      console.warn('[native-push] token restore in settings failed:', error);
    }
  }

  const subscription = token ? nativePushSubscriptionFromToken(token) : null;
  return {
    permission,
    enabled: isNativePushActive(permission, token),
    subscription,
  };
}

export async function subscribeToNativePush(): Promise<PushSubscriptionDto> {
  if (!isNativePushPlatform()) {
    throw new Error('Native push is only available in the Guardr app');
  }

  initNativePushBridge();

  const permission = await requestNativePushPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted');
  }

  const token = await waitForNativePushRegistration();
  return nativePushSubscriptionFromToken(token);
}

export async function unsubscribeFromNativePush(): Promise<void> {
  setStoredNativePushToken(null);
  if (!isNativePushPlatform()) return;
  // Keep bridge listeners alive — removing them breaks re-registration and tap handling.
}

export function listenForNativePushNavigation(onNavigate: (url: string) => void): () => void {
  if (!isNativePushPlatform()) return () => undefined;

  initNativePushBridge();

  const handle = PushNotifications.addListener('pushNotificationActionPerformed', (event: ActionPerformed) => {
    const url = resolveNotificationUrl(
      event.notification.data?.url ?? event.notification.data?.link
    );
    onNavigate(url);
  });

  return () => {
    void handle.then((h) => h.remove());
  };
}

export function listenForNativePushReceived(
  onReceived: (notification: PushNotificationSchema) => void
): () => void {
  if (!isNativePushPlatform()) return () => undefined;

  initNativePushBridge();

  const handle = PushNotifications.addListener('pushNotificationReceived', onReceived);
  return () => {
    void handle.then((h) => h.remove());
  };
}
