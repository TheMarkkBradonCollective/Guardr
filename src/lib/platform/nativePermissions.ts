import { Capacitor } from '@capacitor/core';
import { Camera } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { PushNotifications } from '@capacitor/push-notifications';

/**
 * Request Android/iOS runtime permissions needed by Guardr field workflows.
 * Called once on native app launch (after splash).
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

  try {
    await PushNotifications.requestPermissions();
  } catch (error) {
    console.warn('[native] push permission request failed:', error);
  }
}
