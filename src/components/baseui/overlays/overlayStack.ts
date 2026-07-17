import { useCallback, useEffect, useRef } from 'react';
import { pushOverlayBackHistory } from '../../../lib/systemBackButton';

export interface DialogEntry {
  token: symbol;
  onClose: () => void;
}

const openDialogStack: DialogEntry[] = [];

/** Close the topmost modal/sheet/drawer — used by system back button. */
export function closeTopmostDialog(): boolean {
  const top = openDialogStack[openDialogStack.length - 1];
  if (!top) return false;
  top.onClose();
  return true;
}

function isTopmostToken(token: symbol): boolean {
  return openDialogStack[openDialogStack.length - 1]?.token === token;
}

/**
 * Registers overlay on the dialog stack; Escape and system back only close when topmost.
 * Returns a gated `onClose` safe for Base Web backdrop handlers.
 */
export function useOverlayCloseGate(active: boolean, onClose: () => void, dismissable = true): () => void {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const tokenRef = useRef<symbol | null>(null);

  useEffect(() => {
    if (!active) return;
    const token = Symbol('dialog');
    tokenRef.current = token;
    const entry: DialogEntry = {
      token,
      onClose: () => {
        if (dismissable) onCloseRef.current();
      },
    };
    openDialogStack.push(entry);
    const releaseOverlayHistory = dismissable
      ? pushOverlayBackHistory(() => onCloseRef.current())
      : () => {};

    const onKey = (e: KeyboardEvent) => {
      if (!dismissable) return;
      if (e.key === 'Escape' && isTopmostToken(token)) {
        onCloseRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      const idx = openDialogStack.findIndex((item) => item.token === token);
      if (idx !== -1) openDialogStack.splice(idx, 1);
      window.removeEventListener('keydown', onKey);
      releaseOverlayHistory();
      if (tokenRef.current === token) tokenRef.current = null;
    };
  }, [active, dismissable]);

  return useCallback(() => {
    if (!dismissable) return;
    if (tokenRef.current && isTopmostToken(tokenRef.current)) {
      onCloseRef.current();
    }
  }, [dismissable]);
}

/** Returns keyboard focus to the element focused before the overlay opened. */
export function useReturnFocusOnClose(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    return () => {
      if (
        previouslyFocused &&
        document.contains(previouslyFocused) &&
        typeof previouslyFocused.focus === 'function'
      ) {
        previouslyFocused.focus();
      }
    };
  }, [active]);
}
