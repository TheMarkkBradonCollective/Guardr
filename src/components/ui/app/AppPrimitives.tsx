import React from 'react';
import { ArrowLeft, ChevronRight, Filter, Search, Send } from 'lucide-react';

export function AppScreen({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`app-screen ${className}`}>{children}</div>;
}

export function AppScreenTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="app-screen-title">{children}</h1>;
}

export function AppPageLead({
  kicker,
  subtitle,
  title,
}: {
  kicker?: string;
  subtitle?: string;
  title: string;
}) {
  return (
    <div className="app-page-lead">
      {kicker && <p className="app-page-lead-kicker">{kicker}</p>}
      {subtitle && <p className="app-page-lead-sub">{subtitle}</p>}
      <h1 className="app-page-lead-title">{title}</h1>
    </div>
  );
}

export function AppSubScreenHeader({
  title,
  onBack,
  backLabel = 'Back',
}: {
  title: string;
  onBack: () => void;
  backLabel?: string;
}) {
  return (
    <div className="app-subscreen-header">
      <button type="button" onClick={onBack} className="app-subscreen-back">
        <ArrowLeft className="w-4 h-4" />
        {backLabel}
      </button>
      <h1 className="app-subscreen-title truncate">{title}</h1>
    </div>
  );
}

export function AppHeroBand({
  label,
  icon,
  children,
  footer,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section className="app-hero-band">
      <p className="app-hero-band-label">
        {icon}
        {label}
      </p>
      {children}
      {footer}
    </section>
  );
}

export function AppStatusBanner({
  icon,
  title,
  children,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="app-status-banner">
      {icon && <div className="shrink-0 mt-0.5">{icon}</div>}
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-sm font-semibold">{title}</p>
        {children}
        {action}
      </div>
    </div>
  );
}

export function AppSection({
  title,
  actionLabel,
  onAction,
  children,
  bleed = false,
  className = '',
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
  bleed?: boolean;
  className?: string;
}) {
  return (
    <section className={`app-section ${className}`}>
      <div className="app-section-head">
        <h2>{title}</h2>
        {actionLabel && onAction && (
          <button type="button" onClick={onAction} className="app-section-link">
            {actionLabel}
          </button>
        )}
      </div>
      <div className={bleed ? 'app-section-body-bleed' : 'app-section-body'}>{children}</div>
    </section>
  );
}

export function AppFormSection({
  children,
  className = '',
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
}) {
  return (
    <section className={`app-form-section ${className}`}>
      {title && <div className="app-form-section-title">{title}</div>}
      {children}
    </section>
  );
}

export function AppList({ children }: { children: React.ReactNode }) {
  return <div className="app-list">{children}</div>;
}

/** Stacked clickable entity cards (guards, clients, tickets, etc.) */
export function AppItemCardStack({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`app-item-card-stack ${className}`}>{children}</div>;
}

export function AppItemCard({
  children,
  onClick,
  className = '',
  selected = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  selected?: boolean;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`app-item-card app-item-card-align-top ${selected ? 'app-item-card-selected' : ''} ${className}`}
    >
      {children}
    </Tag>
  );
}

/** Flat row for read-only lists. Use AppItemCard for clickable entities. */
export function AppListRow({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  if (onClick) {
    return (
      <AppItemCard onClick={onClick} className={className}>
        {children}
      </AppItemCard>
    );
  }
  return <div className={`app-list-row ${className}`}>{children}</div>;
}

export function InlineSearch({
  value,
  onChange,
  placeholder = 'Search…',
  onFilterClick,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFilterClick?: () => void;
}) {
  return (
    <div className="app-search-inline">
      <Search className="w-4 h-4 shrink-0 text-brand-text-muted" strokeWidth={1.5} />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {onFilterClick && (
        <button type="button" onClick={onFilterClick} className="app-search-filter-btn" aria-label="Filter">
          <Filter className="w-4 h-4" strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}

export function AvatarPlaceholder({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  return (
    <div className={`app-avatar-placeholder ${size === 'sm' ? 'app-avatar-sm' : 'app-avatar-md'}`}>
      {name.charAt(0)}
    </div>
  );
}

/** Confident dashboard hero — greeting + optional status pill */
export function AppDashboardHero({
  kicker,
  title,
  status,
}: {
  kicker?: string;
  title: string;
  status?: React.ReactNode;
}) {
  return (
    <header className="app-dashboard-hero">
      <div className="min-w-0">
        {kicker && <p className="app-page-lead-kicker">{kicker}</p>}
        <h1 className="app-dashboard-hero-title">{title}</h1>
      </div>
      {status}
    </header>
  );
}

/** Grouped overview zone with optional action link */
export function AppDashboardZone({
  title,
  actionLabel,
  onAction,
  children,
  className = '',
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`app-dashboard-zone ${className}`}>
      <div className="app-dashboard-zone-head">
        <h2 className="app-dashboard-zone-title">{title}</h2>
        {actionLabel && onAction && (
          <button type="button" onClick={onAction} className="app-section-link">
            {actionLabel}
          </button>
        )}
      </div>
      <div className="app-dashboard-zone-body">{children}</div>
    </section>
  );
}

export function AppMetricStrip({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`app-metric-strip ${className}`}>{children}</div>;
}

export function AppMetricCell({
  label,
  value,
  sub,
  onClick,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  onClick?: () => void;
  accent?: boolean;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`app-metric-cell ${accent ? 'app-metric-cell-accent' : ''} ${onClick ? 'app-metric-cell-clickable' : ''}`}
    >
      <p className="app-metric-cell-label">{label}</p>
      <p className="app-metric-cell-value">{value}</p>
      {sub && <p className="app-metric-cell-sub">{sub}</p>}
    </Tag>
  );
}

export function AppSegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="app-segmented-control" role="tablist">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="tab"
          aria-selected={value === opt.id}
          onClick={() => onChange(opt.id)}
          className={`app-segmented-control-item ${value === opt.id ? 'app-segmented-control-item-active' : ''}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function AppInboxList({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`app-inbox-list ${className}`}>{children}</div>;
}

export function AppInboxRow({
  title,
  subtitle,
  preview,
  meta,
  badges,
  leading,
  selected = false,
  onClick,
}: {
  title: string;
  subtitle?: string;
  preview?: string;
  meta?: string;
  badges?: React.ReactNode;
  leading?: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`app-inbox-row ${selected ? 'app-inbox-row-selected' : ''}`}
    >
      {leading && <div className="app-inbox-row-leading shrink-0">{leading}</div>}
      <div className="app-inbox-row-main">
        <div className="app-inbox-row-top">
          <p className="app-inbox-row-title">{title}</p>
          {meta && <span className="app-inbox-row-meta">{meta}</span>}
        </div>
        {subtitle && <p className="app-inbox-row-subtitle">{subtitle}</p>}
        {preview && <p className="app-inbox-row-preview">{preview}</p>}
        {badges && <div className="app-inbox-row-badges">{badges}</div>}
      </div>
      <ChevronRight className="w-4 h-4 shrink-0 text-brand-text-muted app-inbox-row-chevron lg:hidden" strokeWidth={1.75} />
    </button>
  );
}

export function AppChatHeader({
  title,
  subtitle,
  onBack,
  trailing,
  hideBackOnDesktop = false,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  trailing?: React.ReactNode;
  hideBackOnDesktop?: boolean;
}) {
  return (
    <div className="app-chat-header">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className={`app-chat-header-back ${hideBackOnDesktop ? 'lg:hidden' : ''}`}
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" strokeWidth={1.75} />
        </button>
      )}
      <div className="app-chat-header-copy min-w-0 flex-1">
        <p className="app-chat-header-title">{title}</p>
        {subtitle && <p className="app-chat-header-sub">{subtitle}</p>}
      </div>
      {trailing}
    </div>
  );
}

export type AppChatBubbleTone = 'outgoing' | 'incoming' | 'staff' | 'system';

export type AppChatSender = {
  name: string;
  roleLabel?: string;
  showBrand?: boolean;
};

export function AppChatBubble({
  sender,
  senderLabel,
  body,
  timestamp,
  tone,
}: {
  sender?: AppChatSender;
  senderLabel?: string;
  body: string;
  timestamp?: string;
  tone: AppChatBubbleTone;
}) {
  return (
    <div className={`app-chat-bubble app-chat-bubble-${tone}`}>
      {(sender || senderLabel) && (
        <div className="app-chat-bubble-sender">
          {sender ? (
            <>
              {sender.showBrand && <span className="app-chat-bubble-brand">Guardr</span>}
              <span className="app-chat-bubble-name">{sender.name}</span>
              {sender.roleLabel && <span className="app-chat-bubble-role">{sender.roleLabel}</span>}
            </>
          ) : (
            <span className="app-chat-bubble-name">{senderLabel}</span>
          )}
        </div>
      )}
      <p className="app-chat-bubble-body whitespace-pre-wrap">{body}</p>
      {timestamp && <p className="app-chat-bubble-time">{timestamp}</p>}
    </div>
  );
}

export function AppChatComposer({
  value,
  onChange,
  onSend,
  placeholder = 'Type a message…',
  disabled = false,
  submitting = false,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void | Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  submitting?: boolean;
}) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const resizeComposer = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  React.useEffect(() => {
    resizeComposer();
  }, [value]);

  return (
    <div className="app-chat-composer">
      <div className="app-chat-composer-field">
        <textarea
          ref={textareaRef}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void onSend();
            }
          }}
          placeholder={placeholder}
          disabled={disabled || submitting}
          className="app-chat-composer-input"
        />
        <button
          type="button"
          onClick={() => void onSend()}
          disabled={disabled || submitting || !value.trim()}
          className="app-chat-composer-send"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
