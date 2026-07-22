export type DownloadLiveContext = 'apk' | 'pwa' | 'browser';

export const INSTALL_APK_TITLE = 'APK (Full Version)';
export const INSTALL_PWA_TITLE = 'PWA (Lite Version)';

export function accountMenuInstallLabel(context: DownloadLiveContext): string {
  if (context === 'apk') return 'Update';
  if (context === 'pwa') return INSTALL_APK_TITLE;
  return 'Download';
}

export function downloadScreenTitle(context: DownloadLiveContext): string {
  if (context === 'apk') return 'App update';
  if (context === 'pwa') return 'Upgrade to full app';
  return 'App versions';
}

export function downloadScreenIntro(context: DownloadLiveContext): string {
  if (context === 'apk') {
    return 'Install the latest build when an update is available. Your account and data stay synced.';
  }
  if (context === 'pwa') {
    return 'You are on the lite home-screen app. It auto-updates with guardr.co — upgrade below for stronger native alerts, GPS, and camera.';
  }
  return 'Pick how Guardr lives on your phone — lite web shortcut or full Android app.';
}

export function downloadLiveContextMessage(context: DownloadLiveContext): string {
  if (context === 'apk') {
    return 'Full version installed';
  }
  if (context === 'pwa') {
    return 'Lite version · auto-updates';
  }
  return 'Browser';
}

export const INSTALL_APK_SHORT = 'Full version';
export const INSTALL_PWA_SHORT = 'Lite version';
