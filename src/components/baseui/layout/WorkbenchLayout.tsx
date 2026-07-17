import React from 'react';
import { Block } from 'baseui/block';
import { LabelSmall, ParagraphMedium } from 'baseui/typography';
import type { LucideIcon } from 'lucide-react';

export function WorkbenchPage({
  children,
  className = '',
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`uber-workbench ${className}`.trim()} {...rest}>
      {children}
    </div>
  );
}

export function WorkbenchBody({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`uber-workbench-body ${className}`.trim()}>{children}</div>;
}

export function WorkbenchToolbar({
  eyebrow,
  subtitle,
  actions,
  children,
}: {
  eyebrow?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="uber-workbench-toolbar">
      <div className="min-w-0 flex-1">
        {eyebrow ? <p className="uber-workbench-eyebrow">{eyebrow}</p> : null}
        {subtitle ? <p className="uber-workbench-subtitle">{subtitle}</p> : null}
        {children}
      </div>
      {actions ? <Block display="flex" alignItems="center" gridGap="scale300" overrides={{ Block: { style: { flexShrink: 0 } } }}>{actions}</Block> : null}
    </div>
  );
}

export function WorkbenchStatChips<T extends string>({
  items,
  activeId,
  onSelect,
}: {
  items: { id: T; label: string; value: number }[];
  activeId: T;
  onSelect: (id: T) => void;
}) {
  return (
    <div className="uber-workbench-stats" role="tablist">
      {items.map(({ id, label, value }) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={activeId === id}
          className={`uber-stat-chip${activeId === id ? ' uber-stat-chip--active' : ''}`}
          onClick={() => onSelect(id)}
        >
          <span className="uber-stat-chip-value">{value}</span>
          <span className="uber-stat-chip-label">{label}</span>
        </button>
      ))}
    </div>
  );
}

export function WorkbenchSplit({
  list,
  detail,
  className = '',
}: {
  list: React.ReactNode;
  detail: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`uber-workbench-split ${className}`.trim()}>
      <div className="uber-workbench-list">{list}</div>
      <div className="uber-workbench-detail">
        <div className="uber-workbench-detail-inner">{detail}</div>
      </div>
    </div>
  );
}

export function WorkbenchEmpty({
  icon: Icon,
  message,
  action,
  variant = 'default',
}: {
  icon?: LucideIcon;
  message: string;
  action?: React.ReactNode;
  variant?: 'default' | 'detail';
}) {
  return (
    <div className={`uber-workbench-empty${variant === 'detail' ? ' uber-workbench-empty--detail' : ''}`}>
      {Icon ? <Icon size={variant === 'detail' ? 40 : 32} strokeWidth={1.5} style={{ opacity: 0.45 }} /> : null}
      <ParagraphMedium margin={0} color="contentSecondary">
        {message}
      </ParagraphMedium>
      {action}
    </div>
  );
}

export function WorkbenchSectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="staff-overview-desktop-section-label">{children}</p>;
}

export function WorkbenchGrid({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`staff-overview-desktop-grid ${className}`.trim()}>{children}</div>;
}

export function WorkbenchGridCell({
  span = 12,
  children,
  className = '',
}: {
  span?: 3 | 4 | 6 | 8 | 12;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`staff-overview-desktop-span-${span} ${className}`.trim()}>
      {children}
    </div>
  );
}

export function WorkbenchQuickLinks({
  items,
}: {
  items: { id: string; label: string; icon: LucideIcon; onClick: () => void }[];
}) {
  return (
    <nav className="staff-overview-desktop-quick-links" aria-label="Quick navigation">
      {items.map(({ id, label, icon: Icon, onClick }) => (
        <button key={id} type="button" className="staff-overview-desktop-quick-link" onClick={onClick}>
          <Icon className="w-4 h-4" aria-hidden />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

export function WorkbenchCardTitle({ children }: { children: React.ReactNode }) {
  return (
    <LabelSmall
      marginTop={0}
      marginBottom="scale400"
      $style={{ fontWeight: 700, fontSize: '14px', letterSpacing: '-0.01em', textTransform: 'none' }}
    >
      {children}
    </LabelSmall>
  );
}
