import { Capacitor } from '@capacitor/core';

function readPx(value: string | null | undefined): number {
  if (!value) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Measure layout vs visual viewport gaps (Android WebView often reports env() as 0). */
export function measureNativeSafeAreaInsets(): {
  top: number;
  bottom: number;
  left: number;
  right: number;
} {
  const vv = window.visualViewport;
  let top = 0;
  let bottom = 0;
  let left = 0;
  let right = 0;

  if (vv) {
    top = Math.max(0, Math.round(vv.offsetTop));
    left = Math.max(0, Math.round(vv.offsetLeft));
    bottom = Math.max(0, Math.round(window.innerHeight - (vv.offsetTop + vv.height)));
    right = Math.max(0, Math.round(window.innerWidth - (vv.offsetLeft + vv.width)));
  }

  const probe = document.createElement('div');
  probe.style.cssText =
    'position:fixed;visibility:hidden;pointer-events:none;' +
    'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left);';
  document.documentElement.appendChild(probe);
  const cs = getComputedStyle(probe);
  top = Math.max(top, readPx(cs.paddingTop));
  right = Math.max(right, readPx(cs.paddingRight));
  bottom = Math.max(bottom, readPx(cs.paddingBottom));
  left = Math.max(left, readPx(cs.paddingLeft));
  probe.remove();

  return { top, bottom, left, right };
}

function applyNativeSafeAreaInsets(): void {
  const { top, bottom, left, right } = measureNativeSafeAreaInsets();
  const root = document.documentElement;
  root.style.setProperty('--gr-safe-area-top', `${top}px`);
  root.style.setProperty('--gr-safe-area-right', `${right}px`);
  root.style.setProperty('--gr-safe-area-bottom', `${bottom}px`);
  root.style.setProperty('--gr-safe-area-left', `${left}px`);
}

/** Apply CSS variables so bottom nav and shift UI sit above Android system navigation. */
export function initNativeSafeArea(): void {
  if (!Capacitor.isNativePlatform()) return;

  document.body.classList.add('capacitor-native');
  if (Capacitor.getPlatform() === 'android') {
    document.body.classList.add('capacitor-android');
  }

  applyNativeSafeAreaInsets();

  const refresh = () => requestAnimationFrame(applyNativeSafeAreaInsets);
  window.visualViewport?.addEventListener('resize', refresh);
  window.visualViewport?.addEventListener('scroll', refresh);
  window.addEventListener('resize', refresh);
  window.addEventListener('orientationchange', () => window.setTimeout(applyNativeSafeAreaInsets, 150));
}
