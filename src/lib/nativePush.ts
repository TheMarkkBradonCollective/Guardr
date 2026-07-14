import { Capacitor } from '@capacitor/core';
import {
  ActionPerformed,
  PushNotificationSchema,
  PushNotifications,
  Token,
} from '@capacitor/push-notifications';
import type { PushSubscriptionDto } from './push';
import { isPushEnabledLocally, setPushEnabledLocally } from './pushLocalState';

export const FCM_NATIVE_ENDPOINT_PREFIX = 'fcm-native:';
const NATIVE_PUSH_TOKEN_KEY = 'guardr_native_push_token';

export const NATIVE_FCM_NOT_CONFIGURED_MESSAGE =
  'Push registration is not available in this app build yet. Add android/app/google-services.json from Firebase, set FCM_SERVICE_ACCOUNT_JSON on the server, then rebuild the APK.';

type PendingRegistration = {
  resolve: (token: string) => void;
  reject: (error: Error) => void;
};

let bridgeInstalled = false;
let pendingRegistration: PendingRegistration | null = null;
let registerInFlight: Promise<string> | null = null;

export function isNativePushPlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/** True when this APK was built with Firebase google-services.json present. */
export function isNativeFcmConfigured(): boolean {
  const flag = (import.meta as ImportMeta & { env?: Record<string, string> }).env
    ?.VITE_NATIVE_FCM_CONFIGURED;
  return flag === 'true';
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

/** True when OS permission is granted and this device has an FCM token. */
export function isNativePushActive(
  permission: NotificationPermission | 'unsupported',
  token: string | null = getStoredNativePushToken()
): boolean {
  return permission === 'granted' && !!token;
}

/** Keep local opt-in aligned with an existing native registration. */
export function syncNativePushLocalState(
  permission: NotificationPermission | 'unsupported',
  token: string | null = getStoredNativePushToken()
): boolean {
  const active = isNativePushActive(permission, token);
  if (active && !isPushEnabledLocally()) {
    setPushEnabledLocally(true);
  }
  if (!active && isPushEnabledLocally()) {
    setPushEnabledLocally(false);
  }
  return active;
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
    const message = event.error || 'Push registration failed';
    console.warn('[native-push] registration error:', message);
    if (pendingRegistration) {
      rejectPendingRegistration(new Error(message));
    }
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

function invokeNativeRegister(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Defer so Capacitor listeners are attached before Firebase is touched.
    window.setTimeout(() => {
      void PushNotifications.register()
        .then(() => resolve())
        .catch((error: unknown) => {
          reject(error instanceof Error ? error : new Error('Push registration failed'));
        });
    }, 100);
  });
}

export async function waitForNativePushRegistration(timeoutMs = 20000): Promise<string> {
  if (!isNativePushPlatform()) {
    throw new Error('Native push is only available in the Guardr app');
  }

  if (!isNativeFcmConfigured()) {
    throw new Error(NATIVE_FCM_NOT_CONFIGURED_MESSAGE);
  }

  initNativePushBridge();

  const existing = getStoredNativePushToken();
  if (existing) return existing;

  if (registerInFlight) return registerInFlight;

  registerInFlight = new Promise<string>((resolve, reject) => {
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

    void invokeNativeRegister().catch((error: unknown) => {
      clearTimeout(timeout);
      if (pendingRegistration) {
        pendingRegistration = null;
        reject(error instanceof Error ? error : new Error('Push registration failed'));
      } else {
        console.warn('[native-push] register failed:', error);
      }
    });
  }).finally(() => {
    registerInFlight = null;
  });

  return registerInFlight;
}

export async function restoreNativePushIfEnabled(): Promise<void> {
  if (!isNativePushPlatform() || !isNativeFcmConfigured()) return;

  const permission = await getNativePushPermission();
  const token = getStoredNativePushToken();
  syncNativePushLocalState(permission, token);

  // Never call PushNotifications.register() on cold boot — it can crash the WebView
  // when Firebase is misconfigured. Registration happens only from Settings toggle.
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
  const token = getStoredNativePushToken();
  const subscription = token ? nativePushSubscriptionFromToken(token) : null;
  const enabled = syncNativePushLocalState(permission, token);
  return {
    permission,
    enabled,
    subscription,
  };
}

export async function subscribeToNativePush(): Promise<PushSubscriptionDto> {
  if (!isNativePushPlatform()) {
    throw new Error('Native push is only available in the Guardr app');
  }

  initNativePushBridge();

  let permission = await getNativePushPermission();
  if (permission !== 'granted') {
    permission = await requestNativePushPermission();
  }
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted');
  }

  const token = await waitForNativePushRegistration();
  setPushEnabledLocally(true);
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
