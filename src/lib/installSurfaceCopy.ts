export type DownloadLiveContext = 'apk' | 'browser';

export const INSTALL_APK_TITLE = 'Android app';
export const INSTALL_APK_SHORT = 'APK';

export function accountMenuInstallLabel(context: DownloadLiveContext): string {
  if (context === 'apk') return 'Update';
  return 'Download';
}

export function downloadScreenTitle(context: DownloadLiveContext): string {
  if (context === 'apk') return 'App update';
  return 'Download the apps';
}

export function downloadScreenIntro(context: DownloadLiveContext): string {
  if (context === 'apk') {
    return 'Install the latest Guard, Customer, or Staff build when an update is available. Your account and data stay synced.';
  }
  return 'Sign up and complete activation on this website. After that, customers and guards need Guard or Customer to use the platform. Staff can run the full system in the browser.';
}

export function downloadLiveContextMessage(context: DownloadLiveContext): string {
  if (context === 'apk') {
    return 'Android app installed';
  }
  return 'Website';
}
