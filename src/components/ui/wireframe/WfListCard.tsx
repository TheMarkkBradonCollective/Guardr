import React from 'react';
import { ChevronRight } from 'lucide-react';

interface WfListCardProps {
  avatar?: React.ReactNode;
  title: string;
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
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`app-item-card app-item-card-align-top ${onClick ? '' : ''} ${className}`}
    >
      {avatar && <div className="shrink-0">{avatar}</div>}
      <div className="min-w-0 flex-1 text-left">
        <p className="font-semibold text-[0.9375rem] leading-snug truncate">{title}</p>
        {subtitle && (
          <p className="text-sm text-brand-text-muted mt-0.5 leading-snug line-clamp-2">{subtitle}</p>
        )}
        {meta && <div className="mt-2 text-xs text-brand-text-muted">{meta}</div>}
      </div>
      {action ?? (
        actionLabel ? (
          <span className="app-pill-btn shrink-0">{actionLabel}</span>
        ) : onClick ? (
          <ChevronRight className="w-5 h-5 text-brand-text-muted shrink-0" />
        ) : null
      )}
    </Wrapper>
  );
}
