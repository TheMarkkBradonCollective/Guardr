import { Capacitor } from '@capacitor/core';
import { isStandaloneDisplay } from './platform/device';
import { isAndroidWebView } from './platform/installRegistry';
import type { DownloadLiveContext } from './installSurfaceCopy';

/**
 * Live shell for download / update UI.
 * Must not use isNativeShell() — that alias means “installed PWA or APK”.
 */
export function resolveDownloadLiveContext(): DownloadLiveContext {
  if (typeof window === 'undefined') return 'browser';
  if (Capacitor.isNativePlatform() || isAndroidWebView()) return 'apk';
  if (isStandaloneDisplay()) return 'pwa';
  return 'browser';
}
