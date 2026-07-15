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

/** Clickable entity row — matches overview attention-item layout. */
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
      className={`app-item-card app-item-card-align-top ${className}`}
    >
      <div className="flex items-start gap-3 w-full min-w-0 text-left">
        {avatar && <div className="shrink-0">{avatar}</div>}
        <div className="min-w-0 flex-1">
          {typeof title === 'string' ? (
            <p className="text-sm font-semibold leading-snug truncate">{title}</p>
          ) : (
            <div className="text-sm font-semibold leading-snug min-w-0">{title}</div>
          )}
          {subtitle && (
            <p className="text-xs text-brand-text-muted mt-1 leading-relaxed truncate">{subtitle}</p>
          )}
          {meta && <div className="mt-1.5 w-full">{meta}</div>}
        </div>
        {action ?? (
          actionLabel ? (
            <span className="app-pill-btn shrink-0">{actionLabel}</span>
          ) : onClick ? (
            <ChevronRight className="w-4 h-4 text-brand-text-muted shrink-0 mt-0.5" />
          ) : null
        )}
      </div>
    </Wrapper>
  );
}
