import { useEffect, useMemo, useRef } from 'react';

export interface KeyboardShortcut {
  /**
   * Combination in canonical form: modifiers in `ctrl`/`meta`/`alt`/`shift`
   * order joined with `+`, then the key. Examples: `"alt+1"`, `"mod+k"`,
   * `"shift+?"`, `"escape"`.
   *
   * `mod` matches Cmd on macOS and Ctrl elsewhere.
   */
  combo: string;
  /** Description shown in the shortcut reference sheet. */
  description: string;
  /** Grouping in the reference sheet. */
  group?: string;
  handler: (event: KeyboardEvent) => void;
  /** Fires even while a text field has focus. Default false. */
  allowInInput?: boolean;
  /** Skips `preventDefault`. Default false. */
  passive?: boolean;
}

const EDITABLE = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (EDITABLE.has(target.tagName)) return true;
  return target.isContentEditable;
}

/** Normalises a live event into the same string format as `combo`. */
export function eventCombo(event: KeyboardEvent): string {
  const parts: string[] = [];
  if (event.ctrlKey) parts.push('ctrl');
  if (event.metaKey) parts.push('meta');
  if (event.altKey) parts.push('alt');
  if (event.shiftKey) parts.push('shift');
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase();
  parts.push(key);
  return parts.join('+');
}

/** Expands `mod` into the platform-appropriate modifier. */
export function expandCombo(combo: string, isMac: boolean): string[] {
  const normalised = combo.trim().toLowerCase();
  if (!normalised.includes('mod+')) return [normalised];
  return [normalised.replace('mod+', isMac ? 'meta+' : 'ctrl+')];
}

/** Human-readable rendering for the shortcut sheet, e.g. `⌘ K` or `Ctrl K`. */
export function formatCombo(combo: string, isMac: boolean): string {
  return combo
    .split('+')
    // Lowercased first: hints authored as "Alt 3" by the navigation model would
    // otherwise miss every modifier case below and render literally on macOS.
    .map((raw) => raw.trim().toLowerCase())
    .map((part) => {
      if (part === 'mod') return isMac ? '⌘' : 'Ctrl';
      if (part === 'meta') return isMac ? '⌘' : 'Win';
      if (part === 'ctrl') return 'Ctrl';
      if (part === 'alt') return isMac ? '⌥' : 'Alt';
      if (part === 'shift') return isMac ? '⇧' : 'Shift';
      if (part === 'escape') return 'Esc';
      if (part === 'arrowup') return '↑';
      if (part === 'arrowdown') return '↓';
      if (part === 'arrowleft') return '←';
      if (part === 'arrowright') return '→';
      if (part === 'enter') return '↵';
      return part.length === 1 ? part.toUpperCase() : part.replace(/^./, (c) => c.toUpperCase());
    })
    .join(' ');
}

function detectMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /mac|iphone|ipad/i.test(navigator.platform || navigator.userAgent || '');
}

/**
 * Desktop keyboard shortcuts.
 *
 * Registered on `window` in the capture-free bubble phase so an open dialog can
 * still stop propagation. Shortcuts are suppressed while typing unless they opt
 * in, which is what keeps `Alt+1` from firing inside a search field.
 *
 * Desktop only: the mobile and tablet surfaces do not register shortcuts because
 * neither has a reliable physical keyboard.
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true): void {
  const isMac = useMemo(detectMac, []);
  const ref = useRef(shortcuts);
  ref.current = shortcuts;

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const onKeyDown = (event: KeyboardEvent) => {
      const combo = eventCombo(event);
      const editable = isEditableTarget(event.target);

      for (const shortcut of ref.current) {
        if (!expandCombo(shortcut.combo, isMac).includes(combo)) continue;
        if (editable && !shortcut.allowInInput) continue;
        if (!shortcut.passive) event.preventDefault();
        shortcut.handler(event);
        return;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled, isMac]);
}

export function useIsMacPlatform(): boolean {
  return useMemo(detectMac, []);
}
