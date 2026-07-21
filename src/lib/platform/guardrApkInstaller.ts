import { registerPlugin } from '@capacitor/core';

export interface GuardrApkInstallerPlugin {
  downloadAndInstall(options: { url: string }): Promise<void>;
}

export const GuardrApkInstaller = registerPlugin<GuardrApkInstallerPlugin>('GuardrApkInstaller');
