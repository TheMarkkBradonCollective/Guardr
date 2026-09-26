const DEVICE_ID_STORAGE_KEY = 'guardr_device_id_v1';

/** Browser/PWA stable id (shared across tabs on the same origin). */
export function getOrCreateBrowserDeviceId(): string {
  if (typeof window === 'undefined') return 'unknown';
  try {
    const existing = window.localStorage.getItem(DEVICE_ID_STORAGE_KEY);
    if (existing && existing.length >= 8) return existing;
    const id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    window.localStorage.setItem(DEVICE_ID_STORAGE_KEY, id);
    return id;
  } catch {
    return 'unknown';
  }
}

/**
 * One Guardr device key across website, PWA, and native shells.
 * Native uses Capacitor Device id when available; web uses persisted UUID.
 */
export async function resolveDeviceId(): Promise<string> {
  if (typeof window === 'undefined') return 'unknown';
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      const { Device } = await import('@capacitor/device');
      const { identifier } = await Device.getId();
      if (identifier) return `cap:${identifier}`;
    }
  } catch {
    /* web or plugin unavailable */
  }
  return `web:${getOrCreateBrowserDeviceId()}`;
}
