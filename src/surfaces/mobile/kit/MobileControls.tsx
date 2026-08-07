import React, { useCallback, useRef, useState } from 'react';
import { ChevronRight, Plus, type LucideIcon } from 'lucide-react';
import { triggerHaptic } from '../../../lib/platform/nativeHaptics';

/* ── Buttons ──────────────────────────────────────────────────────────────── */

export interface MobileButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  /** Fills the available width — the default for mobile CTAs. */
  block?: boolean;
  icon?: LucideIcon;
  loading?: boolean;
  className?: string;
}

/**
 * Full-bleed 52px CTA. Every mobile button is thumb-sized and reports a press
 * with a scale-down plus a haptic tick on native shells.
 */
export function MobileButton({
  variant = 'primary',
  block = true,
  icon: Icon,
  loading = false,
  children,
  className,
  onClick,
  disabled,
  ...rest
}: MobileButtonProps) {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    void triggerHaptic(variant === 'danger' ? 'warning' : 'light');
    onClick?.(event);
  };

  return (
    <button
      type="button"
      className={`sfm-btn sfm-btn--${variant}${block ? ' sfm-btn--block' : ''}${className ? ` ${className}` : ''}`}
      data-loading={loading ? 'true' : undefined}
      disabled={disabled || loading}
      onClick={handleClick}
      {...rest}
    >
      {loading ? <span className="sfm-btn-spinner" aria-hidden /> : Icon ? <Icon size={20} strokeWidth={2.25} aria-hidden /> : null}
      <span className="sfm-btn-label">{children}</span>
    </button>
  );
}

/** Floating action button. Sits above the tab bar in the thumb arc. */
export function MobileFab({
  label,
  icon: Icon = Plus,
  onClick,
  extended = false,
}: {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  /** Shows the label beside the icon for the screen's single main action. */
  extended?: boolean;
}) {
  return (
    <button
      type="button"
      className="sfm-fab"
      data-extended={extended ? 'true' : undefined}
      aria-label={label}
      onClick={() => {
        void triggerHaptic('medium');
        onClick();
      }}
    >
      <Icon size={24} strokeWidth={2.5} aria-hidden />
      {extended ? <span className="sfm-fab-label">{label}</span> : null}
    </button>
  );
}

/* ── Segmented control ────────────────────────────────────────────────────── */

export interface MobileSegmentedOption<T extends string> {
  value: T;
  label: string;
  badge?: number;
}

/** Pill segmented control with a sliding active indicator. */
export function MobileSegmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel = 'Filter',
}: {
  options: MobileSegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
}) {
  const index = Math.max(0, options.findIndex((option) => option.value === value));
  const count = Math.max(1, options.length);

  return (
    <div className="sfm-segmented" role="tablist" aria-label={ariaLabel}>
      <span
        className="sfm-segmented-thumb"
        aria-hidden
        style={{ width: `${100 / count}%`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          className="sfm-segmented-btn"
          data-active={option.value === value ? 'true' : undefined}
          onClick={() => {
            void triggerHaptic('light');
            onChange(option.value);
          }}
        >
          {option.label}
          {option.badge != null && option.badge > 0 ? (
            <span className="sfm-segmented-badge">{option.badge > 99 ? '99+' : option.badge}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

/* ── Rows and cards ──────────────────────────────────────────────────────── */

export interface MobileListRowProps {
  title: string;
  subtitle?: string;
  meta?: string;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick?: () => void;
  /** Hides the chevron on rows that are not navigational. */
  chevron?: boolean;
  status?: React.ReactNode;
}

/** 68px tap row. The mobile app's primary list unit. */
export function MobileListRow({
  title,
  subtitle,
  meta,
  leading,
  trailing,
  onClick,
  chevron = true,
  status,
}: MobileListRowProps) {
  const interactive = Boolean(onClick);
  const Tag = interactive ? 'button' : 'div';

  return (
    <Tag
      {...(interactive ? { type: 'button' as const, onClick } : {})}
      className="sfm-row"
      data-interactive={interactive ? 'true' : undefined}
    >
      {leading ? <span className="sfm-row-leading">{leading}</span> : null}
      <span className="sfm-row-text">
        <span className="sfm-row-title">{title}</span>
        {subtitle ? <span className="sfm-row-subtitle">{subtitle}</span> : null}
        {status ? <span className="sfm-row-status">{status}</span> : null}
      </span>
      <span className="sfm-row-trailing">
        {meta ? <span className="sfm-row-meta">{meta}</span> : null}
        {trailing}
        {interactive && chevron ? <ChevronRight size={20} strokeWidth={2} aria-hidden className="sfm-row-chevron" /> : null}
      </span>
    </Tag>
  );
}

export function MobileCard({
  children,
  onClick,
  className,
  accent = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  /** Inverted card for the screen's single most important state. */
  accent?: boolean;
}) {
  const interactive = Boolean(onClick);
  const Tag = interactive ? 'button' : 'div';
  return (
    <Tag
      {...(interactive ? { type: 'button' as const, onClick } : {})}
      className={`sfm-card${accent ? ' sfm-card--accent' : ''}${className ? ` ${className}` : ''}`}
      data-interactive={interactive ? 'true' : undefined}
    >
      {children}
    </Tag>
  );
}

export function MobileStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="sfm-stat">
      <span className="sfm-stat-value">{value}</span>
      <span className="sfm-stat-label">{label}</span>
      {hint ? <span className="sfm-stat-hint">{hint}</span> : null}
    </div>
  );
}

export function MobileEmpty({
  title,
  message,
  icon: Icon,
  action,
}: {
  title: string;
  message?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="sfm-empty">
      {Icon ? <Icon size={32} strokeWidth={1.5} aria-hidden className="sfm-empty-icon" /> : null}
      <p className="sfm-empty-title">{title}</p>
      {message ? <p className="sfm-empty-message">{message}</p> : null}
      {action ? <div className="sfm-empty-action">{action}</div> : null}
    </div>
  );
}

/* ── Swipe row ───────────────────────────────────────────────────────────── */

export interface MobileSwipeAction {
  label: string;
  icon?: LucideIcon;
  onAction: () => void;
  tone?: 'neutral' | 'positive' | 'danger';
}

/** Distance the row must travel before the action latches open. */
const SWIPE_OPEN = 72;
/** Horizontal movement required before we claim the gesture from the scroller. */
const SWIPE_CLAIM = 12;

/**
 * Swipe-to-reveal row actions.
 *
 * The gesture is only claimed once horizontal movement clearly exceeds vertical,
 * so a swipe never fights the list's vertical scroll.
 */
export function MobileSwipeRow({
  children,
  actions,
  disabled = false,
}: {
  children: React.ReactNode;
  actions: MobileSwipeAction[];
  disabled?: boolean;
}) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const gesture = useRef<{ x: number; y: number; claimed: boolean; pointerId: number } | null>(null);
  const maxOffset = Math.min(actions.length, 2) * SWIPE_OPEN;

  const reset = useCallback(() => {
    setOffset(0);
    setDragging(false);
    gesture.current = null;
  }, []);

  if (disabled || actions.length === 0) return <>{children}</>;

  const onPointerDown = (event: React.PointerEvent) => {
    gesture.current = { x: event.clientX, y: event.clientY, claimed: false, pointerId: event.pointerId };
  };

  const onPointerMove = (event: React.PointerEvent) => {
    const state = gesture.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const dx = event.clientX - state.x;
    const dy = event.clientY - state.y;

    if (!state.claimed) {
      if (Math.abs(dx) < SWIPE_CLAIM || Math.abs(dx) <= Math.abs(dy)) return;
      state.claimed = true;
      setDragging(true);
    }
    setOffset(Math.max(-maxOffset, Math.min(0, dx)));
  };

  const onPointerUp = (event: React.PointerEvent) => {
    const state = gesture.current;
    if (!state || state.pointerId !== event.pointerId) return;
    const shouldLatch = offset < -SWIPE_OPEN / 2;
    setDragging(false);
    setOffset(shouldLatch ? -maxOffset : 0);
    gesture.current = null;
  };

  return (
    <div className="sfm-swipe" data-open={offset < -8 ? 'true' : undefined}>
      <div className="sfm-swipe-actions" aria-hidden={offset === 0}>
        {actions.slice(0, 2).map((action) => (
          <button
            key={action.label}
            type="button"
            className="sfm-swipe-action"
            data-tone={action.tone ?? 'neutral'}
            onClick={() => {
              void triggerHaptic(action.tone === 'danger' ? 'warning' : 'medium');
              action.onAction();
              reset();
            }}
          >
            {action.icon ? <action.icon size={20} strokeWidth={2.25} aria-hidden /> : null}
            <span>{action.label}</span>
          </button>
        ))}
      </div>
      <div
        className="sfm-swipe-content"
        data-dragging={dragging ? 'true' : undefined}
        style={{ transform: `translate3d(${offset}px, 0, 0)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {children}
      </div>
    </div>
  );
}
