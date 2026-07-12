import React from 'react';
import { MapPin } from 'lucide-react';
import { AccountMenu, type AccountMenuProps } from './AccountMenu';

interface AppScreenHeaderProps {
  title: string;
  subtitle?: string;
  locationLabel?: string;
  accountMenu: AccountMenuProps;
  right?: React.ReactNode;
  extension?: React.ReactNode;
  className?: string;
}

export function AppScreenHeader({
  title,
  subtitle,
  locationLabel,
  accountMenu,
  right,
  extension,
  className = '',
}: AppScreenHeaderProps) {
  const showLocation = !!locationLabel;

  return (
    <header
      className={`app-screen-header shrink-0 border-b border-brand-border bg-brand-surface/88 backdrop-blur-xl backdrop-saturate-150 transition-colors ${extension ? 'app-screen-header--with-extension' : ''} ${className}`}
    >
      <div className="app-screen-header-row px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center gap-3">
        <div className="min-w-0 flex-1 flex items-center gap-3">
          <div className="min-w-0">
            {showLocation ? (
              <button
                type="button"
                className="flex items-center gap-1.5 text-sm font-medium text-brand-text max-w-full"
                aria-label={`Location: ${locationLabel}`}
              >
                <MapPin className="w-4 h-4 text-brand-text shrink-0" />
                <span className="truncate">{locationLabel}</span>
              </button>
            ) : subtitle ? (
              <p className="text-xs text-brand-text-muted leading-none truncate app-screen-header-subtitle">{subtitle}</p>
            ) : null}
            <h1 className="text-lg sm:text-xl font-black truncate leading-tight tracking-[-0.04em] mt-0.5 app-screen-header-title">{title}</h1>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {right}
          <AccountMenu {...accountMenu} />
        </div>
      </div>

      {extension ? <div className="app-screen-header-extension">{extension}</div> : null}
    </header>
  );
}
