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
  if (context === 'pwa') return 'App versions';
  return 'Install Guardr';
}

export function downloadScreenIntro(context: DownloadLiveContext): string {
  if (context === 'apk') {
    return 'Check for updates and install the latest Guardr APK when a new version is available.';
  }
  if (context === 'pwa') {
    return 'You are on the home-screen PWA, which auto-updates with guardr.co. The Android APK is optional for stronger native permissions and may need a manual install when a new build ships.';
  }
  return 'Choose the lite web app or the full Android app. Both use the same Guardr account.';
}

export function downloadLiveContextMessage(context: DownloadLiveContext): string {
  if (context === 'apk') {
    return 'You are on the full Android app. Install updates below when a new version is released.';
  }
  if (context === 'pwa') {
    return 'You are on the PWA (home-screen). It stays current automatically — APK installs below are optional.';
  }
  return 'Install PWA (Lite Version) for quick access, or APK (Full Version) for guards in the field.';
}
