import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { apiUrl, SITE_URL } from '../siteConfig';

export const INSTALL_STORAGE_KEY = 'guardr_install_v1';
export const INSTALL_REGISTER_ORIGIN = SITE_URL;

export interface InstallRecord {
  version: string;
  versionCode?: number;
  registeredAt: number;
}

export interface InstallState {
  apk?: InstallRecord;
}

export function readInstallState(): InstallState {
  try {
    const raw = localStorage.getItem(INSTALL_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as InstallState) : {};
  } catch {
    return {};
  }
}

export function writeInstallState(state: InstallState): void {
  localStorage.setItem(INSTALL_STORAGE_KEY, JSON.stringify(state));
}

export function writeInstallSurface(surface: 'apk', record: InstallRecord): void {
  const state = readInstallState();
  state[surface] = record;
  writeInstallState(state);
}

function registerViaIframe(surface: 'apk', version: string, versionCode?: number): void {
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

async function registerInstallCookie(
  surface: 'apk',
  version: string,
  versionCode?: number
): Promise<void> {
  const params = new URLSearchParams({ surface, version });
  if (versionCode != null) params.set('versionCode', String(versionCode));
  await fetch(apiUrl(`/api/install/register?${params.toString()}`), {
    method: 'GET',
    credentials: 'include',
  });
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

    writeInstallSurface('apk', record);

    // Best-effort analytics for the website download page only — not required for the APK to run.
    try {
      await registerInstallCookie('apk', record.version, record.versionCode);
    } catch {
      /* ignore */
    }
    if (typeof window !== 'undefined' && window.location.hostname.includes('guardr.co')) {
      return;
    }
    try {
      registerViaIframe('apk', record.version, record.versionCode);
    } catch {
      /* ignore */
    }
  } catch (error) {
    console.warn('[install] native registration failed:', error);
  }
}

/** Android System WebView (including Capacitor) — not Chrome. */
export function isAndroidWebView(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent) && /;\s*wv\)/i.test(navigator.userAgent);
}
