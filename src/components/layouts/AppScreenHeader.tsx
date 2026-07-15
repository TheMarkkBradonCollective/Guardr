import React from 'react';
import { AccountMenu, type AccountMenuProps } from './AccountMenu';
import { AppHeaderBranding } from './AppHeaderBranding';

interface AppScreenHeaderProps {
  title: string;
  accountMenu: AccountMenuProps;
  notifications?: React.ReactNode;
  navMenu?: React.ReactNode;
  extension?: React.ReactNode;
  className?: string;
  hideAccountMenu?: boolean;
  brandingTrailing?: React.ReactNode;
  showTitle?: boolean;
}

export function AppScreenHeader({
  title,
  accountMenu,
  notifications,
  navMenu,
  extension,
  className = '',
  hideAccountMenu = false,
  brandingTrailing,
  showTitle = true,
}: AppScreenHeaderProps) {
  return (
    <header
      className={`app-screen-header shrink-0 border-b border-brand-border bg-brand-surface/88 backdrop-blur-xl backdrop-saturate-150 transition-colors ${extension ? 'app-screen-header--with-extension' : ''} ${className}`}
    >
      <div className="app-screen-header-brand-row flex justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-1.5">
        <AppHeaderBranding trailing={brandingTrailing} />
      </div>

      <div className="app-screen-header-row relative flex items-center justify-between gap-2 px-4 pb-3 min-h-[2.75rem]">
        <div className="shrink-0 flex items-center z-[1]">{navMenu}</div>

        {showTitle ? (
          <h1 className="pointer-events-none absolute left-16 right-16 text-center text-base sm:text-lg font-black truncate leading-tight tracking-[-0.04em] app-screen-header-title">
            {title}
          </h1>
        ) : null}

        <div className="shrink-0 flex items-center gap-1.5 z-[1]">
          {notifications}
          {!hideAccountMenu ? <AccountMenu {...accountMenu} /> : null}
        </div>
      </div>

      {extension ? <div className="app-screen-header-extension">{extension}</div> : null}
    </header>
  );
}
