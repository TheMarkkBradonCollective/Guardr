import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { isStandaloneDisplay } from './device';

export const INSTALL_STORAGE_KEY = 'guardr_install_v1';
export const INSTALL_REGISTER_ORIGIN = 'https://guardr.co';

export interface InstallRecord {
  version: string;
  versionCode?: number;
  registeredAt: number;
}

export interface InstallState {
  apk?: InstallRecord;
  pwa?: InstallRecord;
}

export function readInstallState(): InstallState {
  try {
    const raw = localStorage.getItem(INSTALL_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as InstallState) : {};
  } catch {
    return {};
  }
}

export function writeInstallSurface(surface: 'apk' | 'pwa', record: InstallRecord): void {
  const state = readInstallState();
  state[surface] = record;
  localStorage.setItem(INSTALL_STORAGE_KEY, JSON.stringify(state));
}

function registerViaIframe(surface: 'apk' | 'pwa', version: string, versionCode?: number): void {
  if (typeof document === 'undefined') return;
  const params = new URLSearchParams({ surface, version });
  if (versionCode != null) params.set('versionCode', String(versionCode));

  const iframe = document.createElement('iframe');
  iframe.hidden = true;
  iframe.setAttribute('aria-hidden', 'true');
  iframe.src = `${INSTALL_REGISTER_ORIGIN}/download/register.html?${params.toString()}`;
  document.body.appendChild(iframe);
  window.setTimeout(() => iframe.remove(), 8000);
}

/** Ping guardr.co so the download page can detect this APK install + version. */
export async function registerNativeInstall(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const info = await App.getInfo();
    const versionCode = Number.parseInt(info.build, 10);
    const record: InstallRecord = {
      version: info.version,
      versionCode: Number.isFinite(versionCode) ? versionCode : undefined,
      registeredAt: Date.now(),
    };

    if (window.location.hostname === 'guardr.co') {
      writeInstallSurface('apk', record);
    } else {
      registerViaIframe('apk', record.version, record.versionCode);
    }
  } catch (error) {
    console.warn('[install] native registration failed:', error);
  }
}

/** Record PWA install when running from home-screen shortcut (auto-updating web shell). */
export function registerPwaInstall(webVersion: string): void {
  if (!isStandaloneDisplay() || Capacitor.isNativePlatform()) return;
  const record: InstallRecord = {
    version: webVersion,
    registeredAt: Date.now(),
  };
  writeInstallSurface('pwa', record);
}
