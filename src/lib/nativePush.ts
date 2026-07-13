import { Capacitor } from '@capacitor/core';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
} from '@capacitor/push-notifications';
import type { PushSubscriptionDto } from './push';

export const FCM_NATIVE_ENDPOINT_PREFIX = 'fcm-native:';
const NATIVE_PUSH_TOKEN_KEY = 'guardr_native_push_token';

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

function resolveNotificationUrl(rawUrl: unknown): string {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) return '/';
  try {
    const parsed = new URL(rawUrl, 'https://guardr.co');
    return parsed.pathname + parsed.search + parsed.hash;
  } catch {
    return rawUrl.startsWith('/') ? rawUrl : '/';
  }
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

export async function subscribeToNativePush(): Promise<PushSubscriptionDto> {
  if (!isNativePushPlatform()) {
    throw new Error('Native push is only available in the Guardr app');
  }

  const permission = await requestNativePushPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted');
  }

  const existing = getStoredNativePushToken();
  if (existing) {
    return nativePushSubscriptionFromToken(existing);
  }

  const token = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          'Could not register for push notifications. Ensure google-services.json is configured for the Android build.'
        )
      );
    }, 20000);

    const onRegistration = (event: Token) => {
      cleanup();
      resolve(event.value);
    };
    const onRegistrationError = (event: { error: string }) => {
      cleanup();
      reject(new Error(event.error || 'Push registration failed'));
    };

    const regHandle = PushNotifications.addListener('registration', onRegistration);
    const errHandle = PushNotifications.addListener('registrationError', onRegistrationError);

    function cleanup() {
      clearTimeout(timeout);
      void regHandle.then((h) => h.remove());
      void errHandle.then((h) => h.remove());
    }

    void PushNotifications.register();
  });

  setStoredNativePushToken(token);
  return nativePushSubscriptionFromToken(token);
}

export async function unsubscribeFromNativePush(): Promise<void> {
  setStoredNativePushToken(null);
  if (!isNativePushPlatform()) return;
  try {
    const handles = await PushNotifications.removeAllListeners();
    void handles;
  } catch {
    /* ignore */
  }
}

export function listenForNativePushNavigation(onNavigate: (url: string) => void): () => void {
  if (!isNativePushPlatform()) return () => undefined;

  const handles: Array<Promise<{ remove: () => void }>> = [];

  handles.push(
    PushNotifications.addListener('pushNotificationActionPerformed', (event: ActionPerformed) => {
      const url = resolveNotificationUrl(
        event.notification.data?.url ?? event.notification.data?.link
      );
      onNavigate(url);
    })
  );

  return () => {
    for (const handle of handles) {
      void handle.then((h) => h.remove());
    }
  };
}

export function listenForNativePushReceived(
  onReceived: (notification: PushNotificationSchema) => void
): () => void {
  if (!isNativePushPlatform()) return () => undefined;

  const handle = PushNotifications.addListener('pushNotificationReceived', onReceived);
  return () => {
    void handle.then((h) => h.remove());
  };
}
