/**
 * Lightweight wrapper so pwaAutoUpdate.ts can show a snackbar without
 * importing React or BaseUI at module init time.
 *
 * Called via a dynamic import inside pwaAutoUpdate.ts when a new
 * service worker activates.
 */
export function showPwaUpdateToast(): void {
  try {
    const { showAppToast } = require('../components/ui/AppToast') as typeof import('../components/ui/AppToast');
    showAppToast('Updating Guardr…', {
      body: 'A new version is available. Reloading now.',
      tone: 'info',
      durationMs: 1000,
    });
  } catch {
    /* toast bridge may not be ready in very early boot — silent fallback is fine */
  }
}
