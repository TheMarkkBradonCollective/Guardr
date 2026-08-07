import React from 'react';
import { Search, type LucideIcon } from 'lucide-react';

/* ── Page container ──────────────────────────────────────────────────────── */

export interface DesktopWorkspaceProps {
  /** Toolbar row: search, filters, view switches, bulk actions. */
  toolbar?: React.ReactNode;
  /** Tab strip under the toolbar. */
  tabs?: React.ReactNode;
  children: React.ReactNode;
  /** Content owns the full canvas with no padding (maps, boards). */
  bleed?: boolean;
  className?: string;
}

/**
 * The desktop application's page container.
 *
 * A toolbar band, an optional tab strip, then a full-height work area. There is
 * no page title here — the title lives in the shell's top bar next to the
 * breadcrumb, which frees the whole canvas for data.
 */
export function DesktopWorkspace({ toolbar, tabs, children, bleed = false, className }: DesktopWorkspaceProps) {
  return (
    <div className={`sfd-workspace${className ? ` ${className}` : ''}`} data-bleed={bleed ? 'true' : undefined}>
      {toolbar ? <div className="sfd-workspace-toolbar">{toolbar}</div> : null}
      {tabs ? <div className="sfd-workspace-tabs">{tabs}</div> : null}
      <div className="sfd-workspace-body" data-bleed={bleed ? 'true' : undefined}>
        {children}
      </div>
    </div>
  );
}

/* ── Toolbar pieces ──────────────────────────────────────────────────────── */

export function DesktopToolbar({
  search,
  filters,
  actions,
}: {
  search?: React.ReactNode;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="sfd-toolbar">
      {search ? <div className="sfd-toolbar-search">{search}</div> : null}
      {filters ? <div className="sfd-toolbar-filters">{filters}</div> : null}
      {actions ? <div className="sfd-toolbar-actions">{actions}</div> : null}
    </div>
  );
}

export function DesktopSearchInput({
  value,
  onChange,
  placeholder = 'Search',
  shortcutHint,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Rendered as a hint on the right, e.g. `/`. */
  shortcutHint?: string;
}) {
  return (
    <label className="sfd-search">
      <Search size={14} strokeWidth={2.25} aria-hidden />
      <input
        className="sfd-search-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        spellCheck={false}
      />
      {shortcutHint ? <kbd className="sfd-kbd">{shortcutHint}</kbd> : null}
    </label>
  );
}

export function DesktopButton({
  variant = 'secondary',
  icon: Icon,
  children,
  onClick,
  disabled,
  size = 'default',
}: {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: LucideIcon;
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  size?: 'default' | 'small';
}) {
  return (
    <button
      type="button"
      className={`sfd-btn sfd-btn--${variant}`}
      data-size={size}
      onClick={onClick}
      disabled={disabled}
    >
      {Icon ? <Icon size={size === 'small' ? 13 : 15} strokeWidth={2.25} aria-hidden /> : null}
      {children ? <span>{children}</span> : null}
    </button>
  );
}

export function DesktopIconButton({
  icon: Icon,
  label,
  onClick,
  active = false,
}: {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className="sfd-icon-btn"
      onClick={onClick}
      aria-label={label}
      title={label}
      data-active={active ? 'true' : undefined}
    >
      <Icon size={16} strokeWidth={2} aria-hidden />
    </button>
  );
}

/** Filter chip row. Pointer surfaces can afford many small chips at once. */
export function DesktopFilterChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="sfd-chips" role="group" aria-label="Filters">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className="sfd-chip"
          data-active={option.value === value ? 'true' : undefined}
          onClick={() => onChange(option.value)}
          aria-pressed={option.value === value}
        >
          <span>{option.label}</span>
          {option.count != null ? <span className="sfd-chip-count">{option.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function DesktopTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { value: T; label: string; badge?: number }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="sfd-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={tab.value === value}
          className="sfd-tab"
          data-active={tab.value === value ? 'true' : undefined}
          onClick={() => onChange(tab.value)}
        >
          <span>{tab.label}</span>
          {tab.badge != null && tab.badge > 0 ? <span className="sfd-tab-badge">{tab.badge}</span> : null}
        </button>
      ))}
    </div>
  );
}

/* ── Dashboard pieces ────────────────────────────────────────────────────── */

/** Dense metric grid. Four across at 1440px, dropping columns as space shrinks. */
export function DesktopMetricGrid({ children, columns = 4 }: { children: React.ReactNode; columns?: number }) {
  return (
    <div className="sfd-metric-grid" style={{ ['--sfd-metric-cols' as string]: `${columns}` }}>
      {children}
    </div>
  );
}

export function DesktopMetric({
  label,
  value,
  delta,
  tone = 'neutral',
  hint,
  onClick,
}: {
  label: string;
  value: string;
  delta?: string;
  tone?: 'neutral' | 'positive' | 'warning' | 'critical';
  hint?: string;
  onClick?: () => void;
}) {
  const interactive = Boolean(onClick);
  const Tag = interactive ? 'button' : 'div';
  return (
    <Tag
      {...(interactive ? { type: 'button' as const, onClick } : {})}
      className="sfd-metric"
      data-tone={tone}
      data-interactive={interactive ? 'true' : undefined}
    >
      <span className="sfd-metric-label">{label}</span>
      <span className="sfd-metric-value">{value}</span>
      <span className="sfd-metric-foot">
        {delta ? <span className="sfd-metric-delta">{delta}</span> : null}
        {hint ? <span className="sfd-metric-hint">{hint}</span> : null}
      </span>
    </Tag>
  );
}

export function DesktopCard({
  title,
  actions,
  children,
  footer,
  padded = true,
}: {
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  padded?: boolean;
}) {
  return (
    <section className="sfd-card">
      {title || actions ? (
        <header className="sfd-card-head">
          {title ? <h3 className="sfd-card-title">{title}</h3> : <span />}
          {actions ? <div className="sfd-card-actions">{actions}</div> : null}
        </header>
      ) : null}
      <div className="sfd-card-body" data-padded={padded ? 'true' : undefined}>
        {children}
      </div>
      {footer ? <div className="sfd-card-foot">{footer}</div> : null}
    </section>
  );
}

/** Column layout for dashboard zones — a wide main column plus a rail. */
export function DesktopColumns({
  main,
  side,
  sideWidth = 380,
}: {
  main: React.ReactNode;
  side: React.ReactNode;
  sideWidth?: number;
}) {
  return (
    <div className="sfd-columns" style={{ ['--sfd-side-w' as string]: `${sideWidth}px` }}>
      <div className="sfd-columns-main">{main}</div>
      <div className="sfd-columns-side">{side}</div>
    </div>
  );
}

export function DesktopEmpty({
  title,
  message,
  action,
}: {
  title: string;
  message?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="sfd-empty">
      <p className="sfd-empty-title">{title}</p>
      {message ? <p className="sfd-empty-message">{message}</p> : null}
      {action}
    </div>
  );
}
