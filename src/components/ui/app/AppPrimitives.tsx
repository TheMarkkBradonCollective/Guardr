import React from 'react';
import { ArrowLeft, ChevronRight, Filter, Search, Send, Check, CheckCheck, X } from 'lucide-react';

/** Shared type for reply-to context (also exported from ChatThreadPanel) */
export type ChatReplyContext = { senderName: string; body: string };

export function AppEmptyState({
  children,
  className = '',
  dashed = false,
  icon,
  title,
  action,
}: {
  children?: React.ReactNode;
  className?: string;
  dashed?: boolean;
  icon?: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
}) {
  if (icon || title) {
    return (
      <div className={`app-empty-state ${dashed ? 'app-empty-state--dashed' : ''} ${className}`.trim()}>
        {icon && <div className="app-empty-state-icon">{icon}</div>}
        {title && <p className="app-empty-state-title">{title}</p>}
        {children && <p className="app-empty-state-body">{children}</p>}
        {action}
      </div>
    );
  }
  return (
    <p className={`app-empty-state ${dashed ? 'app-empty-state--dashed' : ''} ${className}`.trim()}>
      {children}
    </p>
  );
}

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
  unread = false,
  onClick,
}: {
  title: string;
  subtitle?: string;
  preview?: string;
  meta?: string;
  badges?: React.ReactNode;
  leading?: React.ReactNode;
  selected?: boolean;
  /** Bolds the title and preview to indicate unread messages */
  unread?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`app-inbox-row ${selected ? 'app-inbox-row-selected' : ''} ${unread ? 'app-inbox-row-unread' : ''}`}
    >
      {leading && <div className="app-inbox-row-leading shrink-0">{leading}</div>}
      <div className="app-inbox-row-main">
        <div className="app-inbox-row-top">
          <p className="app-inbox-row-title">{title}</p>
          <div className="flex items-center gap-1.5 shrink-0">
            {meta && <span className="app-inbox-row-meta">{meta}</span>}
            {unread && <span className="app-inbox-unread-dot" aria-hidden />}
          </div>
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
  avatar,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  trailing?: React.ReactNode;
  hideBackOnDesktop?: boolean;
  /** Optional leading avatar element displayed between back button and title */
  avatar?: React.ReactNode;
}) {
  return (
    <div className="app-chat-header">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className={`app-chat-header-back ${hideBackOnDesktop ? 'lg:hidden' : ''}`}
          aria-label="Back"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
        </button>
      ) : (
        <span className="w-0 shrink-0" aria-hidden />
      )}
      {avatar && <div className="shrink-0">{avatar}</div>}
      <div className="min-w-0 flex-1">
        <h1 className="app-chat-header-title">{title}</h1>
        {subtitle && <p className="app-chat-header-sub">{subtitle}</p>}
      </div>
      {trailing && <div className="flex items-center gap-0.5 shrink-0">{trailing}</div>}
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
  groupClass = '',
  replyTo,
  readReceipt = false,
}: {
  sender?: AppChatSender;
  senderLabel?: string;
  body: string;
  timestamp?: string;
  tone: AppChatBubbleTone;
  /** CSS modifier class for grouped messages (app-chat-bubble-gfirst/gmid/glast) */
  groupClass?: string;
  /** Quoted reply context shown above the message body */
  replyTo?: ChatReplyContext;
  /** Show a read-receipt checkmark after the timestamp (own messages only) */
  readReceipt?: boolean;
}) {
  const hasSender = !!(sender || senderLabel);
  return (
    <div className={`app-chat-bubble app-chat-bubble-${tone}${groupClass ? ` ${groupClass}` : ''}`}>
      {/* Reply quote */}
      {replyTo && (
        <div className="app-chat-bubble-reply">
          <div className="app-chat-bubble-reply-content">
            <span className="app-chat-bubble-reply-sender">{replyTo.senderName}</span>
            <p className="app-chat-bubble-reply-text">{replyTo.body}</p>
          </div>
        </div>
      )}

      {/* Sender info */}
      {hasSender && (
        <div className="app-chat-bubble-sender">
          {sender ? (
            <>
              <span className="app-chat-bubble-name">{sender.name}</span>
              {sender.roleLabel && (
                <span className="app-chat-bubble-role">{sender.roleLabel}</span>
              )}
              {sender.showBrand && (
                <span className="app-chat-bubble-brand">via Guardr</span>
              )}
            </>
          ) : (
            <span className="app-chat-bubble-name">{senderLabel}</span>
          )}
        </div>
      )}

      <p className="app-chat-bubble-body whitespace-pre-wrap">{body}</p>

      {/* Timestamp + read receipt row */}
      {(timestamp || readReceipt) && (
        <div className="app-chat-bubble-footer">
          {timestamp && <p className="app-chat-bubble-time">{timestamp}</p>}
          {readReceipt && (
            <span className="app-chat-receipt" title="Sent">
              <Check className="app-chat-receipt-check" strokeWidth={2.5} />
            </span>
          )}
        </div>
      )}
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
  replyTo,
  onCancelReply,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void | Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  submitting?: boolean;
  /** Active reply context to display above the input */
  replyTo?: ChatReplyContext | null;
  /** Called when the user cancels the reply */
  onCancelReply?: () => void;
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

  // Focus textarea when a reply is set
  React.useEffect(() => {
    if (replyTo) {
      textareaRef.current?.focus();
    }
  }, [replyTo]);

  return (
    <div className="app-chat-composer">
      {/* Reply preview strip — full-width, above the padded input area */}
      {replyTo && (
        <div className="app-chat-reply-bar">
          <div className="app-chat-reply-bar-body">
            <p className="app-chat-reply-bar-label">↩ Replying to {replyTo.senderName}</p>
            <p className="app-chat-reply-bar-text">{replyTo.body}</p>
          </div>
          <button
            type="button"
            className="app-chat-reply-bar-cancel"
            onClick={onCancelReply}
            aria-label="Cancel reply"
          >
            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
          </button>
        </div>
      )}

      <div className="app-chat-composer-inner">
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
    </div>
  );
}

/* ─── Form primitives (Guardr v4 — use across auth, flows, profile) ─── */

export function AppFormField({
  label,
  children,
  hint,
  error,
  className = '',
  htmlFor,
}: {
  label?: string;
  children: React.ReactNode;
  hint?: string;
  error?: string;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={`app-form-field ${className}`.trim()}>
      {label && (
        <label className="app-field-label" htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {error && <p className="app-field-error">{error}</p>}
      {hint && !error && <p className="app-field-hint">{hint}</p>}
    </div>
  );
}

export function AppInput({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`app-input uber-input ${className}`.trim()} {...props} />;
}

export function AppTextarea({
  className = '',
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`app-input app-textarea uber-input ${className}`.trim()} {...props} />;
}

export function AppSelect({
  className = '',
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={`app-input app-select uber-select ${className}`.trim()} {...props}>
      {children}
    </select>
  );
}

export function AppChip({
  selected = false,
  children,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      className={`app-chip ${selected ? 'app-chip-selected' : ''} ${className}`.trim()}
      aria-pressed={selected}
      {...props}
    >
      {children}
    </button>
  );
}

export function AppChipGroup({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`app-chip-group ${className}`.trim()}>{children}</div>;
}

export function AppErrorBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-error-banner" role="alert">
      <span className="app-error-banner-dot" aria-hidden />
      <div className="min-w-0 flex-1 text-sm font-medium leading-relaxed">{children}</div>
    </div>
  );
}

export function AppFlowSurface({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`app-flow-surface ${className}`.trim()}>{children}</div>;
}
