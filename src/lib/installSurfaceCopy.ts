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
  if (context === 'pwa') return INSTALL_APK_TITLE;
  return 'Install Guardr';
}

export function downloadScreenIntro(context: DownloadLiveContext): string {
  if (context === 'apk') {
    return 'Check for updates and install the latest Guardr APK when a new version is available.';
  }
  if (context === 'pwa') {
    return 'You are on the lite home-screen version. Upgrade to the full Android app for stronger notifications and native permissions.';
  }
  return 'Choose the lite web app or the full Android app. Both use the same Guardr account.';
}

export function downloadLiveContextMessage(context: DownloadLiveContext): string {
  if (context === 'apk') {
    return 'You are on the full Android app. Install updates below when a new version is released.';
  }
  if (context === 'pwa') {
    return 'You are on PWA (Lite Version). Upgrade to APK (Full Version) below.';
  }
  return 'Install PWA (Lite Version) for quick access, or APK (Full Version) for guards in the field.';
}
