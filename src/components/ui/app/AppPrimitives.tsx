import React from 'react';
import { Block } from 'baseui/block';
import { ArrowLeft, ChevronRight, Filter, Search, Send, Check, CheckCheck, X } from 'lucide-react';
import { ParagraphMedium, LabelSmall, HeadingSmall } from 'baseui/typography';
import { FormControl, Input, Notification, Textarea } from '../../baseui/baseuiShims';
import { DashboardHero, DashboardZone, MetricCell, MetricStrip } from '../../baseui/dashboard';
import { GuardrSegmented } from '../../baseui/GuardrSegmented';
import { formControlOverrides, inputOverrides, textareaOverrides } from '../../baseui/primitives/fieldStyles';
import { AppButton } from '../AppButton';
import { useLayoutFormFactor, useSurfaceKind } from '../../../surfaces';

/** Shared type for reply-to context (also exported from ChatThreadPanel) */
export type ChatReplyContext = { senderName: string; body: string };

export function AppEmptyState({
  children,
  className = '',
  dashed = false,
  icon,
  title,
  message,
  action,
}: {
  children?: React.ReactNode;
  className?: string;
  dashed?: boolean;
  icon?: React.ReactNode;
  title?: string;
  message?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const body = children ?? message;
  if (icon || title) {
    return (
      <Block
        className={`app-empty-state ${className}`.trim()}
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gridGap="scale300"
        padding="scale800"
        overrides={{
          Block: {
            style: {
              textAlign: 'center',
              background: 'transparent',
              border: 'none',
            },
          },
        }}
      >
        {icon && <Block className="app-empty-state-icon">{icon}</Block>}
        {title && (
          <ParagraphMedium margin={0} className="app-empty-state-title" $style={{ fontWeight: 700 }}>
            {title}
          </ParagraphMedium>
        )}
        {body && (
          <LabelSmall margin={0} className="app-empty-state-body" $style={{ color: 'contentSecondary' }}>
            {body}
          </LabelSmall>
        )}
        {action}
      </Block>
    );
  }
  return (
    <LabelSmall
      as="p"
      margin={0}
      className={`app-empty-state ${dashed ? 'app-empty-state--dashed' : ''} ${className}`.trim()}
      $style={{ color: 'contentSecondary' }}
    >
      {children}
    </LabelSmall>
  );
}

export function AppScreen({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const formFactor = useLayoutFormFactor();
  return (
    <Block
      as="div"
      className={`app-screen${formFactor === 'tablet' ? ' app-screen--tablet' : ''} ${className}`.trim()}
      display="flex"
      flexDirection="column"
      minHeight={0}
    >
      {children}
    </Block>
  );
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

export function formatBackToLabel(destinationOrLabel: string): string {
  const trimmed = destinationOrLabel.trim();
  if (!trimmed) return 'Back to previous';
  if (/^back to\s+/i.test(trimmed)) {
    const dest = trimmed.replace(/^back to\s+/i, '').trim();
    return dest ? `Back to ${dest}` : 'Back to previous';
  }
  if (/^back$/i.test(trimmed)) return 'Back to previous';
  return `Back to ${trimmed}`;
}

/** Visible back copy: native apps say “Back”; the aria label keeps the destination. */
export function visibleBackLabel(destinationOrLabel: string, compact: boolean): string {
  return compact ? 'Back' : formatBackToLabel(destinationOrLabel);
}

export function AppSubScreenHeader({
  title,
  subtitle,
  onBack,
  backLabel = 'previous',
  wrapTitle = true,
  hideTitle = false,
  trailing,
}: {
  title: string;
  subtitle?: string;
  onBack: () => void;
  /** Destination name ("Guards") or full phrase ("Back to Guards"). */
  backLabel?: string;
  /** When true (default), title wraps to full width — never ellipsizes with "...". */
  wrapTitle?: boolean;
  /** Back control only — title lives in the scrolling page body. */
  hideTitle?: boolean;
  trailing?: React.ReactNode;
}) {
  const compact = useSurfaceKind() === 'mobile';
  const ariaLabel = formatBackToLabel(backLabel);
  const label = visibleBackLabel(backLabel, compact);
  return (
    <div
      className={`app-subscreen-header app-subscreen-header--shrink${wrapTitle && !hideTitle ? ' app-subscreen-header--wrap' : ''}${hideTitle ? ' app-subscreen-header--back-only' : ''}${trailing ? ' app-subscreen-header--with-trailing' : ''}`}
    >
      <button type="button" onClick={onBack} className="app-subscreen-back" aria-label={ariaLabel}>
        <ArrowLeft className="w-4 h-4" aria-hidden />
        {label}
      </button>
      {!hideTitle ? (
        <div className="flex-1 min-w-0">
          <h1 className="app-subscreen-title">{title}</h1>
          {subtitle ? <p className="app-subscreen-subtitle">{subtitle}</p> : null}
        </div>
      ) : trailing ? (
        <span className="flex-1" aria-hidden />
      ) : null}
      {trailing ? <div className="app-subscreen-trailing">{trailing}</div> : null}
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
    <Block as="section" className="app-hero-band" marginBottom="scale600">
      <LabelSmall
        as="p"
        marginTop={0}
        marginBottom="scale400"
        className="app-hero-band-label"
        $style={{ color: 'accent', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}
        display="flex"
        alignItems="center"
        gridGap="scale300"
      >
        {icon}
        {label}
      </LabelSmall>
      {children}
      {footer}
    </Block>
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
    <Block
      className="app-status-banner"
      display="flex"
      gridGap="scale500"
      padding="scale500"
      marginBottom="scale600"
      backgroundColor="accent50"
      overrides={{
        Block: {
          style: {
            borderRadius: '12px',
            border: '1px solid',
            borderColor: 'accent50',
          },
        },
      }}
    >
      {icon && <Block $style={{ flexShrink: 0, marginTop: '2px' }}>{icon}</Block>}
      <Block minWidth={0} flex="1" display="flex" flexDirection="column" gridGap="scale300">
        <ParagraphMedium margin={0} $style={{ fontSize: '14px', fontWeight: 600 }}>
          {title}
        </ParagraphMedium>
        {children}
        {action}
      </Block>
    </Block>
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
    <Block as="section" className={`app-section ${className}`} marginBottom="scale700">
      <Block className="app-section-head" display="flex" alignItems="center" justifyContent="space-between" gridGap="scale400" marginBottom="scale400">
        <HeadingSmall margin={0}>{title}</HeadingSmall>
        {actionLabel && onAction && (
          <AppButton type="button" variant="ghost" size="inline" onClick={onAction} className="app-section-link">
            {actionLabel}
          </AppButton>
        )}
      </Block>
      <Block className={bleed ? 'app-section-body-bleed' : 'app-section-body'}>{children}</Block>
    </Block>
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

/** Flat native-style settings section — content sits on the app screen, not in a card. */
export function AppSettingsHead({ children }: { children: React.ReactNode }) {
  return <h3 className="settings-section-head">{children}</h3>;
}

export function AppSettingsSection({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`settings-section ${className}`.trim()}>{children}</section>;
}

export function AppSettingsToggleRow({
  label,
  description,
  children,
  className = '',
}: {
  label: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`settings-toggle-row ${className}`.trim()}>
      <div className="min-w-0">
        {typeof label === 'string' ? <span className="text-sm font-medium block">{label}</span> : label}
        {description ? (
          <span className="text-xs text-brand-text-muted block mt-0.5 leading-relaxed">{description}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

/** Bordered card for a single interactive settings control (radio row, picker, etc.). */
export function AppSettingsChoice({
  selected = false,
  children,
  className = '',
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { selected?: boolean }) {
  return (
    <label
      className={`app-settings-choice${selected ? ' app-settings-choice--selected' : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </label>
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
  const cardClassName = `app-item-card app-item-card-align-top ${selected ? 'app-item-card-selected' : ''} ${className}`.trim();

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${cardClassName} w-full text-left`}>
        {children}
      </button>
    );
  }

  return <div className={cardClassName}>{children}</div>;
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
      <Input
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        type="search"
        startEnhancer={<Search className="w-4 h-4 shrink-0 text-brand-text-muted" strokeWidth={1.5} />}
        endEnhancer={
          onFilterClick ? (
            <AppButton
              type="button"
              variant="ghost"
              size="inline"
              onClick={onFilterClick}
              className="app-search-filter-btn"
              aria-label="Filter"
              overrides={{ BaseButton: { style: { minHeight: '32px', padding: '6px' } } }}
            >
              <Filter className="w-4 h-4" strokeWidth={1.5} />
            </AppButton>
          ) : undefined
        }
        overrides={{
          ...inputOverrides('app-search-inline-input'),
          Root: {
            style: {
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              boxShadow: 'none',
            },
          },
        }}
      />
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
export function AppDashboardHero(props: React.ComponentProps<typeof DashboardHero>) {
  return <DashboardHero {...props} />;
}

/** Grouped overview zone with optional action link */
export function AppDashboardZone(props: React.ComponentProps<typeof DashboardZone>) {
  return <DashboardZone {...props} />;
}

export function AppMetricStrip(props: React.ComponentProps<typeof MetricStrip>) {
  return <MetricStrip {...props} />;
}

export function AppMetricCell(props: React.ComponentProps<typeof MetricCell>) {
  return <MetricCell {...props} />;
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
    <GuardrSegmented
      options={options}
      value={value}
      onChange={onChange}
      fill
    />
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
  backLabel = 'Messages',
  trailing,
  hideBackOnDesktop = false,
  avatar,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  /** Destination for the back pill — becomes "Back to …". */
  backLabel?: string;
  trailing?: React.ReactNode;
  hideBackOnDesktop?: boolean;
  /** Optional leading avatar element displayed between back button and title */
  avatar?: React.ReactNode;
}) {
  const formFactor = useLayoutFormFactor();
  const hideBack = hideBackOnDesktop && formFactor !== 'mobile';
  const compact = formFactor === 'mobile';

  return (
    <div className="app-chat-header app-chat-header--with-back-label">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className={`app-subscreen-back ${hideBack ? 'hidden' : ''}`}
          aria-label={formatBackToLabel(backLabel)}
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          {visibleBackLabel(backLabel, compact)}
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
  if (!label) {
    return (
      <div className={`app-form-field ${className}`.trim()}>
        {children}
        {error && <p className="app-field-error">{error}</p>}
        {hint && !error && <p className="app-field-hint">{hint}</p>}
      </div>
    );
  }

  return (
    <FormControl
      label={label}
      htmlFor={htmlFor}
      caption={hint && !error ? hint : undefined}
      error={error}
      overrides={formControlOverrides}
    >
      <div className={`app-form-field ${className}`.trim()}>{children}</div>
    </FormControl>
  );
}

export function AppInput({
  className = '',
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <Input {...(props as unknown as React.ComponentProps<typeof Input>)} overrides={inputOverrides(className)} />;
}

export function AppTextarea({
  className = '',
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <Textarea {...(props as unknown as React.ComponentProps<typeof Textarea>)} overrides={textareaOverrides(className)} />;
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
    <Notification
      kind="negative"
      overrides={{
        Body: {
          style: {
            margin: 0,
            width: '100%',
          },
        },
      }}
    >
      <div className="app-error-banner" role="alert">
        <span className="app-error-banner-dot" aria-hidden />
        <div className="min-w-0 flex-1 text-sm font-medium leading-relaxed">{children}</div>
      </div>
    </Notification>
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
