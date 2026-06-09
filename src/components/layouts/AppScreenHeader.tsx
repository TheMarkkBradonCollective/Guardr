import React from 'react';
import { Logo } from '../Logo';

interface AppScreenHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
}

export function AppScreenHeader({
  title,
  subtitle,
  right,
  className = '',
}: AppScreenHeaderProps) {
  return (
    <header
      className={`app-screen-header shrink-0 z-[1002] px-4 sm:px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center gap-3 border-b border-brand-border ${className}`}
    >
      <Logo size={28} className="shrink-0 text-brand-primary" />
      <div className="min-w-0 flex-1">
        {subtitle && (
          <p className="text-xs text-brand-text-muted leading-none truncate">{subtitle}</p>
        )}
        <h1 className="text-lg font-semibold truncate leading-tight mt-0.5">{title}</h1>
      </div>
      {right && <div className="shrink-0 flex items-center gap-2">{right}</div>}
    </header>
  );
}
