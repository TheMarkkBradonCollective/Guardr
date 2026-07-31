import { Capacitor } from '@capacitor/core';

let reloadScheduled = false;

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

/**
 * PWA shell: poll for new builds, activate waiting workers, and reload once.
 * Native APK sessions skip this — they use the download page / in-app updater.
 */
export function initPwaAutoUpdate(): void {
  if (Capacitor.isNativePlatform() || typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    notifyAndReload();
  });

  void navigator.serviceWorker.ready.then((registration) => {
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
    };

    check();
    window.setInterval(check, 60 * 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check();
    });
  });
}
