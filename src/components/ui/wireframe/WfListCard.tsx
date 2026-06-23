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
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`app-item-card app-item-card-align-top !flex-col !items-stretch gap-2 ${className}`}
    >
      <div className="flex items-start gap-3.5 w-full min-w-0">
        {avatar && <div className="shrink-0">{avatar}</div>}
        <div className="min-w-0 flex-1 text-left">
          {typeof title === 'string' ? (
            <p className="font-bold text-[0.9375rem] leading-snug truncate tracking-tight">{title}</p>
          ) : (
            <div className="font-bold text-[0.9375rem] leading-snug min-w-0 tracking-tight">{title}</div>
          )}
          {subtitle && (
            <p className="text-sm text-brand-text-muted mt-0.5 leading-snug line-clamp-2">{subtitle}</p>
          )}
        </div>
        {action ?? (
          actionLabel ? (
            <span className="app-pill-btn shrink-0">{actionLabel}</span>
          ) : onClick ? (
            <ChevronRight className="w-5 h-5 text-brand-text-muted shrink-0" />
          ) : null
        )}
      </div>
      {meta && <div className="w-full text-xs text-brand-text-muted">{meta}</div>}
    </Wrapper>
  );
}
