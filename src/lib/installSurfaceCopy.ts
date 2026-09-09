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
    return 'Install the latest Hire, Work, or Staff build when an update is available. Your account and data stay synced.';
  }
  return 'Guardr is a website plus three Android apps. Pick Hire, Work, or Staff — each has its own APK and Play bundle.';
}

export function downloadLiveContextMessage(context: DownloadLiveContext): string {
  if (context === 'apk') {
    return 'Android app installed';
  }
  return 'Website';
}
