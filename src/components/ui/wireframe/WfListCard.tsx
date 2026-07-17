import React from 'react';
import { ChevronRight } from 'lucide-react';

interface WfListCardProps {
  avatar?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: string;
  meta?: React.ReactNode;
  action?: React.ReactNode;
  actionLabel?: string;
  onClick?: () => void;
  className?: string;
}

/** Uber-style list row — separator-only, no card border/radius. */
export function WfListCard({
  avatar,
  title,
  subtitle,
  meta,
  action,
  actionLabel,
  onClick,
  className = '',
}: WfListCardProps) {
  const content = (
    <>
      {avatar ? <div style={{ flexShrink: 0 }}>{avatar}</div> : null}
      <div style={{ flex: 1, minWidth: 0 }}>
        {typeof title === 'string' ? (
          <div style={{ fontSize: '15px', fontWeight: 600, lineHeight: '20px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {title}
          </div>
        ) : (
          title
        )}
        {subtitle ? (
          <div style={{ marginTop: '3px', fontSize: '13px', color: 'var(--uber-text-muted, #767676)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {subtitle}
          </div>
        ) : null}
        {meta ? <div style={{ marginTop: '6px' }}>{meta}</div> : null}
      </div>
      {action ? action : actionLabel ? (
        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--uber-text-muted, #767676)', flexShrink: 0 }}>
          {actionLabel}
        </span>
      ) : onClick ? (
        <ChevronRight size={18} style={{ color: 'var(--uber-text-muted, #767676)', flexShrink: 0 }} />
      ) : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`app-item-card app-item-card-align-top wf-list-card wf-list-card-interactive w-full text-left ${className}`.trim()}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={`app-item-card app-item-card-align-top wf-list-card ${className}`.trim()}>
      {content}
    </div>
  );
}
