import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

export const OVERLAY_HISTORY_STATE_KEY = 'guardrOverlay';

type BackHandler = () => boolean;

const backHandlers: BackHandler[] = [];
const overlayClosers: Array<() => void> = [];

/** Register a handler that runs before history navigation (most recent wins). */
export function registerSystemBackHandler(handler: BackHandler): () => void {
  backHandlers.push(handler);
  return () => {
    const index = backHandlers.indexOf(handler);
    if (index !== -1) backHandlers.splice(index, 1);
  };
}

/**
 * Push a history entry so browser / PWA back closes this overlay instead of
 * leaving the app. Call the returned cleanup when the overlay closes via UI.
 */
export function pushOverlayBackHistory(onClose: () => void): () => void {
  if (typeof window === 'undefined') return () => {};

  overlayClosers.push(onClose);
  window.history.pushState({ [OVERLAY_HISTORY_STATE_KEY]: true }, '');

  return () => {
    const index = overlayClosers.lastIndexOf(onClose);
    if (index !== -1) overlayClosers.splice(index, 1);
    const state = window.history.state as Record<string, unknown> | null;
    if (state?.[OVERLAY_HISTORY_STATE_KEY]) {
      window.history.back();
    }
  };
}

/** Browser / PWA popstate: close the top overlay that owned the popped entry. */
export function consumeOverlayPopState(): boolean {
  if (overlayClosers.length === 0) return false;
  const close = overlayClosers.pop();
  close?.();
  return true;
}

function runRegisteredHandlers(): boolean {
  for (let index = backHandlers.length - 1; index >= 0; index -= 1) {
    if (backHandlers[index]()) return true;
  }
  return false;
}

export function canNavigateHistoryBack(): boolean {
  if (typeof window === 'undefined') return false;
  return window.history.length > 1;
}

/**
 * Unified system-back entry point for Android hardware back, PWA gestures, and
 * programmatic calls. Returns true when navigation or dismissal was handled.
 */
export function handleSystemBack(): boolean {
  if (typeof window === 'undefined') return false;

  if (runRegisteredHandlers()) return true;

  if (overlayClosers.length > 0) {
    window.history.back();
    return true;
  }

  if (canNavigateHistoryBack()) {
    window.history.back();
    return true;
  }

  if (Capacitor.isNativePlatform()) {
    void App.minimizeApp();
    return true;
  }

  return false;
}

let capacitorListenerAttached = false;

/** Test-only reset for module-level handler stacks. */
export function resetSystemBackButtonStateForTests(): void {
  backHandlers.length = 0;
  overlayClosers.length = 0;
  capacitorListenerAttached = false;
}

/** Wire Android hardware back to the same handler as browser history. */
export function attachCapacitorBackButtonListener(): () => void {
  if (capacitorListenerAttached || !Capacitor.isNativePlatform()) {
    return () => {};
  }

  capacitorListenerAttached = true;
  let handle: { remove: () => Promise<void> } | null = null;

  void App.addListener('backButton', () => {
    handleSystemBack();
  }).then((listener) => {
    handle = listener;
  });

  return () => {
    capacitorListenerAttached = false;
    void handle?.remove();
    handle = null;
  };
}
