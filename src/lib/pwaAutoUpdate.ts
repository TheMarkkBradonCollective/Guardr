import { Capacitor } from '@capacitor/core';
import { isVersionOlder } from './versionCompare';

const UPDATE_POLL_MS = 5 * 60 * 1000;

let reloadScheduled = false;

/** True when an existing controller was replaced — not the first SW takeover. */
export function shouldReloadOnControllerChange(hadController: boolean): boolean {
  return hadController;
}

function scheduleReload(): void {
  if (reloadScheduled) return;
  reloadScheduled = true;
  // Delay slightly so the toast renders before the page unloads.
  window.setTimeout(() => window.location.reload(), 1200);
}

function notifyAndReload(): void {
  try {
    // Dynamically import so this module stays free of React/BaseUI deps at load time.
    void import('./pwaUpdateToast').then(({ showPwaUpdateToast }) => showPwaUpdateToast());
  } catch {
    /* ignore if toast bridge not ready */
  }
  scheduleReload();
}

/** Check for a waiting service worker and activate it. */
export function activateWaitingServiceWorker(registration: ServiceWorkerRegistration): void {
  const waiting = registration.waiting;
  if (!waiting) return;
  waiting.postMessage({ type: 'SKIP_WAITING' });
}

function watchInstallingWorker(worker: ServiceWorker, hasActiveController: boolean): void {
  worker.addEventListener('statechange', () => {
    if (worker.state === 'installed' && hasActiveController) {
      worker.postMessage({ type: 'SKIP_WAITING' });
    }
  });
}

/** True when the live manifest is ahead of this bundle — triggers a forced SW refresh. */
export function shouldForcePwaRefresh(installedVersion: string, latestVersion: string): boolean {
  return isVersionOlder(installedVersion, latestVersion);
}

async function checkManifestForUpdate(registration: ServiceWorkerRegistration): Promise<void> {
  try {
    const [{ APP_VERSION }, { fetchDownloadVersionManifest }] = await Promise.all([
      import('./appVersion'),
      import('./downloadVersion'),
    ]);
    const manifest = await fetchDownloadVersionManifest();
    if (!shouldForcePwaRefresh(APP_VERSION, manifest.webVersion)) return;

    await registration.update();
    if (registration.waiting && navigator.serviceWorker.controller) {
      activateWaitingServiceWorker(registration);
    }
  } catch {
    /* offline or manifest unavailable */
  }
}

function bindUpdateLifecycle(registration: ServiceWorkerRegistration): void {
  if (registration.waiting && navigator.serviceWorker.controller) {
    activateWaitingServiceWorker(registration);
  }

  registration.addEventListener('updatefound', () => {
    const installing = registration.installing;
    if (!installing) return;
    watchInstallingWorker(installing, Boolean(navigator.serviceWorker.controller));
  });

  const check = () => {
    void registration.update().catch(() => undefined);
    void checkManifestForUpdate(registration);
  };

  check();
  window.setInterval(check, UPDATE_POLL_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check();
  });
  window.addEventListener('focus', check);
}

/**
 * PWA shell: poll for new builds, activate waiting workers, and reload once.
 * Native APK sessions skip this — they use the download page / in-app updater.
 */
export function initPwaAutoUpdate(registration?: ServiceWorkerRegistration | null): void {
  if (Capacitor.isNativePlatform() || typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  // First SW control (fresh install) fires controllerchange — do not reload that.
  // Only reload when an *update* takes over an existing controller.
  let hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!shouldReloadOnControllerChange(hadController)) {
      hadController = true;
      return;
    }
    notifyAndReload();
  });

  if (registration) {
    bindUpdateLifecycle(registration);
    return;
  }

  void navigator.serviceWorker.ready.then(bindUpdateLifecycle);
}
