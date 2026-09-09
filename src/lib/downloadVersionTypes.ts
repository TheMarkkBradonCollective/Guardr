export interface ProductAppApkLinks {
  label: string;
  packageId: string;
  apkUrl: string;
  apkDirectUrl?: string;
}

export interface DownloadVersionManifest {
  webVersion: string;
  apkVersion: string;
  apkVersionCode: number;
  apkUrl: string;
  apkDirectUrl?: string;
  zipUrl?: string;
  zipDirectUrl?: string;
  appsZipUrl?: string;
  appsZipDirectUrl?: string;
  apps?: {
    client?: ProductAppApkLinks;
    guard?: ProductAppApkLinks;
    staff?: ProductAppApkLinks;
  };
  apkApps?: {
    client?: string;
    guard?: string;
    staff?: string;
  };
  updatedAt?: string;
}
