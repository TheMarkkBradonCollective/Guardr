import React from 'react';
import { Filter, Search } from 'lucide-react';

export function AppScreen({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`app-screen ${className}`}>{children}</div>;
}

export function AppScreenTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="app-screen-title">{children}</h1>;
}

export function AppSection({
  title,
  actionLabel,
  onAction,
  children,
  bleed = false,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  children: React.ReactNode;
  bleed?: boolean;
}) {
  return (
    <section className="app-section">
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

export function AppList({ children }: { children: React.ReactNode }) {
  return <div className="app-list">{children}</div>;
}

export function AppListRow({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag type={onClick ? 'button' : undefined} onClick={onClick} className={`app-list-row ${className}`}>
      {children}
    </Tag>
  );
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
