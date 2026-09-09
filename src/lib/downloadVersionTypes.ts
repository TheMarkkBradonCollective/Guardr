export interface DownloadVersionManifest {
  webVersion: string;
  apkVersion: string;
  apkVersionCode: number;
  apkUrl: string;
  apkDirectUrl?: string;
  appsZipUrl?: string;
  appsZipDirectUrl?: string;
  apkApps?: {
    client: string;
    guard: string;
    staff: string;
  };
  updatedAt?: string;
}
