import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';

/**
 * Request Android/iOS runtime permissions needed by Guardr field workflows.
 * Push notification permission is requested only when the user enables push in Settings.
 */
export async function ensureNativePermissions(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await Geolocation.requestPermissions();
  } catch (error) {
    console.warn('[native] location permission request failed:', error);
  }

  try {
    await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
  } catch (error) {
    console.warn('[native] camera/photos permission request failed:', error);
  }
}
