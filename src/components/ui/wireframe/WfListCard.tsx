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

/** Clickable entity card — guards, clients, jobs, posts, etc. */
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
  const Wrapper = onClick ? 'button' : 'div';
  const isSelected = className.includes('app-item-card-selected');
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`app-item-card app-item-card-align-top wf-list-card-row ${className}`}
    >
      <div className="wf-list-card-row-main">
        <div className="flex items-start gap-3 w-full min-w-0">
          {avatar && <div className="shrink-0">{avatar}</div>}
          <div className="min-w-0 flex-1 text-left">
            {typeof title === 'string' ? (
              <p className="wf-list-card-title truncate">{title}</p>
            ) : (
              <div className="wf-list-card-title min-w-0">{title}</div>
            )}
            {subtitle && (
              <p className="wf-list-card-subtitle truncate">{subtitle}</p>
            )}
          </div>
          {action ?? (
            actionLabel ? (
              <span className="app-pill-btn shrink-0">{actionLabel}</span>
            ) : onClick ? (
              <ChevronRight className="w-4 h-4 text-brand-text-muted shrink-0 mt-0.5" />
            ) : null
          )}
        </div>
        {meta && <div className="wf-list-card-meta">{meta}</div>}
      </div>
      {isSelected && <span className="wf-list-card-selected-bar" aria-hidden />}
    </Wrapper>
  );
}
