import { Capacitor } from '@capacitor/core';

let hidden = false;

/**
 * capacitor.config sets SplashScreen.launchAutoHide = false, so the web app
 * must hide it. LoadingScreen did this only when it rendered; a fast start or
 * a render error left the black splash up. Call once the first frame paints.
 */
export async function hideNativeSplash(): Promise<void> {
  if (hidden || !Capacitor.isNativePlatform()) return;
  hidden = true;
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    await SplashScreen.hide({ fadeOutDuration: 150 });
  } catch (error) {
    hidden = false;
    console.warn('[native] splash hide failed:', error);
  }
}

/** Hide after the first paint, with a hard cap so the splash never sticks. */
export function scheduleNativeSplashHide(maxWaitMs = 4000): void {
  if (!Capacitor.isNativePlatform() || typeof window === 'undefined') return;
  const run = () => void hideNativeSplash();
  window.requestAnimationFrame(() => window.requestAnimationFrame(run));
  window.setTimeout(run, maxWaitMs);
}
