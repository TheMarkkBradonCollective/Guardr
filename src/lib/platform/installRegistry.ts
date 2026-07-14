import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { apiUrl, SITE_URL } from '../siteConfig';
import { isAndroid, isStandaloneDisplay } from './device';

export const INSTALL_STORAGE_KEY = 'guardr_install_v1';
export const INSTALL_REGISTER_ORIGIN = SITE_URL;

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

export function writeInstallState(state: InstallState): void {
  localStorage.setItem(INSTALL_STORAGE_KEY, JSON.stringify(state));
}

export function writeInstallSurface(surface: 'apk' | 'pwa', record: InstallRecord): void {
  const state = readInstallState();
  state[surface] = record;
  if (surface === 'apk') {
    delete state.pwa;
  }
  writeInstallState(state);
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

async function registerInstallCookie(
  surface: 'apk' | 'pwa',
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

    await registerInstallCookie('apk', record.version, record.versionCode);

    if (window.location.hostname === 'guardr.co') {
      writeInstallSurface('apk', record);
    } else {
      registerViaIframe('apk', record.version, record.versionCode);
    }
  } catch (error) {
    console.warn('[install] native registration failed:', error);
  }
}

/**
 * Record PWA install when running from a browser home-screen shortcut only.
 * Android APK WebViews also report standalone display mode — exclude those.
 */
export function registerPwaInstall(webVersion: string): void {
  if (Capacitor.isNativePlatform()) return;
  if (!isStandaloneDisplay()) return;
  if (isAndroid() && isAndroidWebView()) return;

  const record: InstallRecord = {
    version: webVersion,
    registeredAt: Date.now(),
  };
  writeInstallSurface('pwa', record);
  void registerInstallCookie('pwa', webVersion).catch((error) => {
    console.warn('[install] pwa cookie registration failed:', error);
  });
}

/** Android System WebView (including Capacitor) — not a Chrome PWA shortcut. */
export function isAndroidWebView(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent) && /;\s*wv\)/i.test(navigator.userAgent);
}
