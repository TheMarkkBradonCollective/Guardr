import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ChevronLeft, X, type LucideIcon } from 'lucide-react';

/* ── Screen ──────────────────────────────────────────────────────────────── */

export interface TabletScreenProps {
  title?: string;
  subtitle?: string;
  /** Toolbar row above the content: search, filters, view switches. */
  toolbar?: React.ReactNode;
  /** Actions aligned to the right of the title row. */
  actions?: React.ReactNode;
  children: React.ReactNode;
  /** Content fills the canvas with no padding (expanded maps). */
  bleed?: boolean;
  className?: string;
}

/**
 * The tablet application's page container.
 *
 * Unlike the mobile screen there is no collapsing hero and no bottom action bar:
 * the tablet always has room for a persistent title row plus a toolbar, and
 * primary actions live inline beside the title where a two-handed grip reaches
 * them.
 */
export function TabletScreen({
  title,
  subtitle,
  toolbar,
  actions,
  children,
  bleed = false,
  className,
}: TabletScreenProps) {
  return (
    <section className={`sft-screen${className ? ` ${className}` : ''}`} data-bleed={bleed ? 'true' : undefined}>
      {title || actions ? (
        <header className="sft-screen-head">
          <div className="sft-screen-head-text">
            {title ? <h1 className="sft-screen-title">{title}</h1> : null}
            {subtitle ? <p className="sft-screen-subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div className="sft-screen-actions">{actions}</div> : null}
        </header>
      ) : null}
      {toolbar ? <div className="sft-screen-toolbar">{toolbar}</div> : null}
      <div className="sft-screen-body" data-bleed={bleed ? 'true' : undefined}>
        {children}
      </div>
    </section>
  );
}

/* ── Split view ──────────────────────────────────────────────────────────── */

export interface TabletSplitViewProps {
  /** Master column: the list, roster, or thread index. */
  list: React.ReactNode;
  /** Detail column, shown alongside the list rather than pushed over it. */
  detail: React.ReactNode;
  /** Shown in the detail column when nothing is selected. */
  placeholder?: React.ReactNode;
  hasSelection: boolean;
  /** Width of the master column. */
  listWidth?: number;
  /**
   * In portrait the split collapses to the detail with a back affordance — a
   * two-column split at 768px wide leaves neither column usable.
   */
  onCloseDetail?: () => void;
  detailTitle?: string;
}

/**
 * Master/detail split — the tablet's default page structure.
 *
 * Landscape shows both columns. Portrait shows the list until something is
 * selected, then swaps to the detail with a back button. Mobile never renders
 * this: it pushes a whole new screen instead.
 */
export function TabletSplitView({
  list,
  detail,
  placeholder,
  hasSelection,
  listWidth = 360,
  onCloseDetail,
  detailTitle,
}: TabletSplitViewProps) {
  return (
    <div
      className="sft-split"
      data-selected={hasSelection ? 'true' : undefined}
      style={{ ['--sft-list-w' as string]: `${listWidth}px` }}
    >
      <div className="sft-split-list">{list}</div>
      <div className="sft-split-detail">
        {hasSelection ? (
          <>
            {onCloseDetail ? (
              <div className="sft-split-detail-bar">
                <button
                  type="button"
                  className="sft-icon-btn"
                  onClick={onCloseDetail}
                  aria-label="Back to list"
                >
                  <ChevronLeft size={22} strokeWidth={2.25} aria-hidden />
                </button>
                {detailTitle ? <span className="sft-split-detail-title">{detailTitle}</span> : null}
              </div>
            ) : null}
            <div className="sft-split-detail-body">{detail}</div>
          </>
        ) : (
          <div className="sft-split-empty">{placeholder}</div>
        )}
      </div>
    </div>
  );
}

/* ── Side panel (the tablet overlay model) ───────────────────────────────── */

export interface TabletSidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  width?: number;
  children: React.ReactNode;
}

/**
 * Slide-in side panel — the tablet's overlay model.
 *
 * Docks to the trailing edge and leaves the underlying split view interactive,
 * which is the point: on a tablet the surrounding context is large enough to
 * stay useful, so covering it with a bottom sheet would waste the screen.
 */
export function TabletSidePanel({
  open,
  onClose,
  title,
  subtitle,
  footer,
  width = 420,
  children,
}: TabletSidePanelProps) {
  const labelId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <div className="sft-panel-root" data-open={open ? 'true' : undefined} aria-hidden={!open}>
      <div className="sft-panel-scrim" onClick={onClose} role="presentation" />
      <aside
        className="sft-panel"
        style={{ width: `${width}px` }}
        role="dialog"
        aria-modal="false"
        aria-labelledby={labelId}
      >
        <header className="sft-panel-head">
          <div>
            <h2 className="sft-panel-title" id={labelId}>
              {title}
            </h2>
            {subtitle ? <p className="sft-panel-subtitle">{subtitle}</p> : null}
          </div>
          <button type="button" className="sft-icon-btn" onClick={onClose} aria-label="Close panel">
            <X size={20} strokeWidth={2.25} aria-hidden />
          </button>
        </header>
        <div className="sft-panel-body">{children}</div>
        {footer ? <div className="sft-panel-footer">{footer}</div> : null}
      </aside>
    </div>
  );
}

/* ── Inspector (persistent third column) ─────────────────────────────────── */

/**
 * Persistent trailing column for context that should never be dismissed —
 * live shift status, map legend, selected job summary.
 */
export function TabletInspector({
  title,
  children,
  collapsible = true,
}: {
  title: string;
  children: React.ReactNode;
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(true);

  return (
    <aside className="sft-inspector" data-open={open ? 'true' : undefined}>
      <header className="sft-inspector-head">
        <h2 className="sft-inspector-title">{title}</h2>
        {collapsible ? (
          <button
            type="button"
            className="sft-icon-btn"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? 'Collapse panel' : 'Expand panel'}
          >
            <ChevronLeft
              size={20}
              strokeWidth={2.25}
              aria-hidden
              style={{ transform: open ? 'rotate(180deg)' : undefined }}
            />
          </button>
        ) : null}
      </header>
      {open ? <div className="sft-inspector-body">{children}</div> : null}
    </aside>
  );
}

/* ── Card grid ───────────────────────────────────────────────────────────── */

/** Two-up (portrait) / three-up (landscape) card grid. */
export function TabletCardGrid({
  children,
  min = 300,
  className,
}: {
  children: React.ReactNode;
  /** Minimum card width before the grid drops a column. */
  min?: number;
  className?: string;
}) {
  return (
    <div
      className={`sft-grid${className ? ` ${className}` : ''}`}
      style={{ ['--sft-card-min' as string]: `${min}px` }}
    >
      {children}
    </div>
  );
}

export function TabletCard({
  title,
  meta,
  children,
  onClick,
  selected = false,
  footer,
}: {
  title?: string;
  meta?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
  footer?: React.ReactNode;
}) {
  const interactive = Boolean(onClick);
  const Tag = interactive ? 'button' : 'div';
  return (
    <Tag
      {...(interactive ? { type: 'button' as const, onClick } : {})}
      className="sft-card"
      data-interactive={interactive ? 'true' : undefined}
      data-selected={selected ? 'true' : undefined}
    >
      {title || meta ? (
        <header className="sft-card-head">
          {title ? <h3 className="sft-card-title">{title}</h3> : <span />}
          {meta}
        </header>
      ) : null}
      {children ? <div className="sft-card-body">{children}</div> : null}
      {footer ? <div className="sft-card-footer">{footer}</div> : null}
    </Tag>
  );
}

/* ── Master list ─────────────────────────────────────────────────────────── */

export interface TabletMasterListItem {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: number;
  leading?: React.ReactNode;
}

/**
 * Selectable list for the master column. Selection is persistent and visible,
 * because on a tablet the selected row stays on screen next to its detail.
 */
export function TabletMasterList({
  items,
  selectedId,
  onSelect,
  emptyMessage = 'Nothing here yet',
  header,
}: {
  items: TabletMasterListItem[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  emptyMessage?: string;
  header?: React.ReactNode;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  // Arrow-key traversal costs nothing on touch and makes the list usable with a
  // keyboard case attached, which is common on tablets.
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      event.preventDefault();
      const index = items.findIndex((item) => item.id === selectedId);
      const next = event.key === 'ArrowDown' ? index + 1 : index - 1;
      const target = items[Math.max(0, Math.min(items.length - 1, next))];
      if (target) onSelect(target.id);
    },
    [items, selectedId, onSelect],
  );

  return (
    <div className="sft-master" ref={listRef} onKeyDown={onKeyDown}>
      {header ? <div className="sft-master-head">{header}</div> : null}
      {items.length === 0 ? (
        <p className="sft-master-empty">{emptyMessage}</p>
      ) : (
        <div className="sft-master-scroll" role="listbox" tabIndex={0} aria-label="Items">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="option"
              aria-selected={item.id === selectedId}
              className="sft-master-row"
              data-selected={item.id === selectedId ? 'true' : undefined}
              onClick={() => onSelect(item.id)}
            >
              {item.leading ? <span className="sft-master-row-leading">{item.leading}</span> : null}
              <span className="sft-master-row-text">
                <span className="sft-master-row-title">{item.title}</span>
                {item.subtitle ? (
                  <span className="sft-master-row-subtitle">{item.subtitle}</span>
                ) : null}
              </span>
              <span className="sft-master-row-trailing">
                {item.meta ? <span className="sft-master-row-meta">{item.meta}</span> : null}
                {item.badge != null && item.badge > 0 ? (
                  <span className="sft-master-row-badge">{item.badge > 99 ? '99+' : item.badge}</span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Toolbar + controls ──────────────────────────────────────────────────── */

export function TabletToolbar({
  leading,
  trailing,
  children,
}: {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="sft-toolbar">
      {leading ? <div className="sft-toolbar-leading">{leading}</div> : null}
      {children ? <div className="sft-toolbar-main">{children}</div> : null}
      {trailing ? <div className="sft-toolbar-trailing">{trailing}</div> : null}
    </div>
  );
}

export function TabletButton({
  variant = 'primary',
  icon: Icon,
  children,
  onClick,
  disabled,
}: {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: LucideIcon;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`sft-btn sft-btn--${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {Icon ? <Icon size={18} strokeWidth={2.25} aria-hidden /> : null}
      <span>{children}</span>
    </button>
  );
}

/** Underlined tab bar. Distinct from the mobile pill segmented control. */
export function TabletTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string; badge?: number }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="sft-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={tab.value === value}
          className="sft-tab"
          data-active={tab.value === value ? 'true' : undefined}
          onClick={() => onChange(tab.value)}
        >
          <span>{tab.label}</span>
          {tab.badge != null && tab.badge > 0 ? (
            <span className="sft-tab-badge">{tab.badge > 99 ? '99+' : tab.badge}</span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

export function TabletMetric({
  label,
  value,
  delta,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: 'neutral' | 'positive' | 'warning' | 'critical';
}) {
  return (
    <div className="sft-metric" data-tone={tone}>
      <span className="sft-metric-label">{label}</span>
      <span className="sft-metric-value">{value}</span>
      {delta ? <span className="sft-metric-delta">{delta}</span> : null}
    </div>
  );
}

export function TabletEmpty({ title, message, action }: { title: string; message?: string; action?: React.ReactNode }) {
  return (
    <div className="sft-empty">
      <p className="sft-empty-title">{title}</p>
      {message ? <p className="sft-empty-message">{message}</p> : null}
      {action}
    </div>
  );
}
