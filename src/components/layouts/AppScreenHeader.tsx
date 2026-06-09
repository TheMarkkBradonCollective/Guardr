import React from 'react';
import { Logo } from '../Logo';
import { Menu } from 'lucide-react';

interface AppScreenHeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
  menuLabel?: string;
  menuClassName?: string;
  right?: React.ReactNode;
  className?: string;
}

export function AppScreenHeader({
  title,
  subtitle,
  onMenuClick,
  menuLabel = 'Open menu',
  menuClassName = '',
  right,
  className = '',
}: AppScreenHeaderProps) {
  return (
    <header
      className={`shrink-0 z-[1002] h-14 px-3 sm:px-4 flex items-center gap-3 border-b border-brand-border bg-brand-bg-sec ${className}`}
    >
      {onMenuClick && (
        <button
          type="button"
          onClick={onMenuClick}
          className={`p-2 -ml-1 rounded-xl border border-brand-border text-brand-text hover:bg-brand-surface transition-colors shrink-0 ${menuClassName}`}
          aria-label={menuLabel}
        >
          <Menu className="w-5 h-5" />
        </button>
      )}
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <Logo size={26} className="shrink-0 text-brand-primary" />
        <div className="min-w-0">
          {subtitle && (
            <p className="text-[10px] font-mono uppercase tracking-widest text-brand-text-muted leading-none truncate">
              {subtitle}
            </p>
          )}
          <p className="text-sm sm:text-base font-semibold truncate leading-tight">{title}</p>
        </div>
      </div>
      {right && <div className="shrink-0 flex items-center gap-2">{right}</div>}
    </header>
  );
}
