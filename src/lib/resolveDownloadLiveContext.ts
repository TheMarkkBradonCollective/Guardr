import { Capacitor } from '@capacitor/core';
import { isAndroidWebView } from './platform/installRegistry';
import type { DownloadLiveContext } from './installSurfaceCopy';

/**
 * Live shell for download / update UI.
 * Website browser, combined PWA, or native APK/AAB.
 */
export function resolveDownloadLiveContext(): DownloadLiveContext {
  if (typeof window === 'undefined') return 'browser';
  if (Capacitor.isNativePlatform() || isAndroidWebView()) return 'apk';
  return 'browser';
}
