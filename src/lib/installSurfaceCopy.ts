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
  return 'Android apps are in Downloads on your website account after activation. Sign up and finish activation here first.';
}

export function downloadLiveContextMessage(context: DownloadLiveContext): string {
  if (context === 'apk') {
    return 'Android app installed';
  }
  return 'Website';
}
