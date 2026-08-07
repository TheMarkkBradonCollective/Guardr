import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { PanelRightClose, X, type LucideIcon } from 'lucide-react';

/* ── Resizable panel group ───────────────────────────────────────────────── */

export interface DesktopPanelGroupProps {
  /** Leading panel — the list or queue. */
  primary: React.ReactNode;
  /** Trailing panel — the detail or editor. */
  secondary: React.ReactNode;
  /** Optional third column pinned to the trailing edge. */
  tertiary?: React.ReactNode;
  /** Starting width of the leading panel, px. */
  initialPrimaryWidth?: number;
  minPrimaryWidth?: number;
  maxPrimaryWidth?: number;
  /** Persists the width under this key so the layout survives a reload. */
  storageKey?: string;
  tertiaryWidth?: number;
}

function readStoredWidth(key: string | undefined, fallback: number): number {
  if (!key || typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(`guardr_panel_${key}`);
    const value = raw ? Number.parseInt(raw, 10) : Number.NaN;
    return Number.isFinite(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Multi-panel workspace with a draggable splitter.
 *
 * The desktop surface is the only one that offers this: it needs three columns
 * visible at once for triage work, and a pointer to drag the divider. The tablet
 * uses a fixed two-column split and mobile pushes one screen at a time.
 */
/** Space the secondary panel must keep, so the primary can never starve it. */
const MIN_SECONDARY_WIDTH = 320;

export function DesktopPanelGroup({
  primary,
  secondary,
  tertiary,
  initialPrimaryWidth = 380,
  minPrimaryWidth = 260,
  maxPrimaryWidth = 620,
  storageKey,
  tertiaryWidth = 340,
}: DesktopPanelGroupProps) {
  const [width, setWidth] = useState(() => readStoredWidth(storageKey, initialPrimaryWidth));
  const [available, setAvailable] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const clamp = useCallback(
    (value: number) => {
      // The container ceiling matters as much as the configured maximum: a stored
      // or configured width from a wider window would otherwise squeeze the
      // detail panel to nothing on a smaller one.
      const ceiling =
        available != null
          ? Math.max(
              minPrimaryWidth,
              available - MIN_SECONDARY_WIDTH - (tertiary ? tertiaryWidth : 0) - 5,
            )
          : maxPrimaryWidth;
      return Math.max(minPrimaryWidth, Math.min(Math.min(maxPrimaryWidth, ceiling), value));
    },
    [available, maxPrimaryWidth, minPrimaryWidth, tertiary, tertiaryWidth],
  );

  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width;
      if (next != null) setAvailable(next);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setWidth((value) => clamp(value));
  }, [clamp]);

  useEffect(() => {
    if (!dragging) return;

    const onMove = (event: PointerEvent) => {
      const left = containerRef.current?.getBoundingClientRect().left ?? 0;
      setWidth(clamp(event.clientX - left));
    };
    const onUp = () => setDragging(false);

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    // A splitter drag that crosses an iframe or leaves the window must still end.
    window.addEventListener('pointercancel', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [dragging, clamp]);

  useEffect(() => {
    if (!storageKey || typeof window === 'undefined' || dragging) return;
    try {
      window.localStorage.setItem(`guardr_panel_${storageKey}`, String(width));
    } catch {
      /* private mode — the width just resets next session */
    }
  }, [storageKey, width, dragging]);

  const onSplitterKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setWidth((value) => clamp(value - (event.shiftKey ? 48 : 16)));
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      setWidth((value) => clamp(value + (event.shiftKey ? 48 : 16)));
    } else if (event.key === 'Home') {
      event.preventDefault();
      setWidth(clamp(initialPrimaryWidth));
    }
  };

  return (
    <div
      className="sfd-panels"
      ref={containerRef}
      data-dragging={dragging ? 'true' : undefined}
      data-tertiary={tertiary ? 'true' : undefined}
      style={{
        ['--sfd-primary-w' as string]: `${width}px`,
        ['--sfd-tertiary-w' as string]: `${tertiaryWidth}px`,
      }}
    >
      <div className="sfd-panel sfd-panel--primary">{primary}</div>
      <div
        className="sfd-splitter"
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panel"
        aria-valuenow={width}
        aria-valuemin={minPrimaryWidth}
        aria-valuemax={maxPrimaryWidth}
        tabIndex={0}
        onPointerDown={() => setDragging(true)}
        onKeyDown={onSplitterKeyDown}
        onDoubleClick={() => setWidth(clamp(initialPrimaryWidth))}
      >
        <span className="sfd-splitter-grip" aria-hidden />
      </div>
      <div className="sfd-panel sfd-panel--secondary">{secondary}</div>
      {tertiary ? <div className="sfd-panel sfd-panel--tertiary">{tertiary}</div> : null}
    </div>
  );
}

/* ── Inspector ───────────────────────────────────────────────────────────── */

/** Dockable trailing inspector with a collapse toggle. */
export function DesktopInspector({
  title,
  subtitle,
  children,
  onClose,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose?: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <aside className="sfd-inspector" aria-label={title}>
      <header className="sfd-inspector-head">
        <div className="sfd-inspector-head-text">
          <h2 className="sfd-inspector-title">{title}</h2>
          {subtitle ? <p className="sfd-inspector-subtitle">{subtitle}</p> : null}
        </div>
        <div className="sfd-inspector-head-actions">
          {actions}
          {onClose ? (
            <button type="button" className="sfd-icon-btn" onClick={onClose} aria-label="Close inspector">
              <PanelRightClose size={16} strokeWidth={2} aria-hidden />
            </button>
          ) : null}
        </div>
      </header>
      <div className="sfd-inspector-body">{children}</div>
    </aside>
  );
}

/* ── Dialog (the desktop overlay model) ──────────────────────────────────── */

export interface DesktopDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  width?: number;
  children: React.ReactNode;
}

/**
 * Centred modal dialog with a focus trap.
 *
 * The desktop surface uses dialogs where the other two use sheets or panels:
 * with a pointer and a large canvas, a centred dialog is the clearest way to say
 * "resolve this before continuing".
 */
export function DesktopDialog({
  open,
  onClose,
  title,
  subtitle,
  footer,
  width = 560,
  children,
}: DesktopDialogProps) {
  const labelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    restoreFocus.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>('[data-autofocus], button, input, select, textarea, a[href]')?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;

      const focusable = [
        ...panel.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((node) => node.offsetParent !== null);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      restoreFocus.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="sfd-dialog-root" role="presentation">
      <div className="sfd-dialog-scrim" onClick={onClose} role="presentation" />
      <div
        className="sfd-dialog"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        style={{ width: `${width}px` }}
      >
        <header className="sfd-dialog-head">
          <div>
            <h2 className="sfd-dialog-title" id={labelId}>
              {title}
            </h2>
            {subtitle ? <p className="sfd-dialog-subtitle">{subtitle}</p> : null}
          </div>
          <button type="button" className="sfd-icon-btn" onClick={onClose} aria-label="Close dialog">
            <X size={16} strokeWidth={2.25} aria-hidden />
          </button>
        </header>
        <div className="sfd-dialog-body">{children}</div>
        {footer ? <div className="sfd-dialog-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

/* ── Hover card ──────────────────────────────────────────────────────────── */

/** Delay before a hover card appears, so passing the pointer over does nothing. */
const HOVER_DELAY = 320;

/**
 * Pointer-only hover card for supplemental detail.
 *
 * Desktop exclusive by design: on touch surfaces there is no hover state, so the
 * same information is inlined or moved into a sheet instead of hidden behind a
 * gesture that cannot happen.
 */
export function DesktopHoverCard({
  trigger,
  children,
  side = 'bottom',
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'bottom';
}) {
  const [open, setOpen] = useState(false);
  const timer = useRef<number | null>(null);

  const cancel = () => {
    if (timer.current != null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  useEffect(() => cancel, []);

  return (
    <span
      className="sfd-hover-root"
      onMouseEnter={() => {
        cancel();
        timer.current = window.setTimeout(() => setOpen(true), HOVER_DELAY);
      }}
      onMouseLeave={() => {
        cancel();
        setOpen(false);
      }}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {trigger}
      {open ? (
        <span className="sfd-hover-card" data-side={side} role="tooltip">
          {children}
        </span>
      ) : null}
    </span>
  );
}

/* ── Status bar ──────────────────────────────────────────────────────────── */

export interface DesktopStatusItem {
  id: string;
  label: string;
  value?: string;
  tone?: 'neutral' | 'positive' | 'warning' | 'critical';
  icon?: LucideIcon;
  onClick?: () => void;
}

/**
 * Persistent bottom status bar — connection, live counts, keyboard hint.
 *
 * Unique to the desktop surface: an operations centre benefits from ambient
 * status that never needs to be opened, and 28px of vertical space is cheap on a
 * 1080p display but unaffordable on a phone.
 */
export function DesktopStatusBar({
  items,
  trailing,
}: {
  items: DesktopStatusItem[];
  trailing?: React.ReactNode;
}) {
  return (
    <footer className="sfd-statusbar" aria-label="Status">
      <div className="sfd-statusbar-items">
        {items.map((item) => {
          const Icon = item.icon;
          const interactive = Boolean(item.onClick);
          const Tag = interactive ? 'button' : 'span';
          return (
            <Tag
              key={item.id}
              {...(interactive ? { type: 'button' as const, onClick: item.onClick } : {})}
              className="sfd-statusbar-item"
              data-tone={item.tone ?? 'neutral'}
              data-interactive={interactive ? 'true' : undefined}
            >
              {Icon ? <Icon size={12} strokeWidth={2.25} aria-hidden /> : null}
              <span className="sfd-statusbar-label">{item.label}</span>
              {item.value ? <span className="sfd-statusbar-value">{item.value}</span> : null}
            </Tag>
          );
        })}
      </div>
      {trailing ? <div className="sfd-statusbar-trailing">{trailing}</div> : null}
    </footer>
  );
}
