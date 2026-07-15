import React from 'react';
import { AccountMenu, type AccountMenuProps } from './AccountMenu';
import { AppHeaderBranding } from './AppHeaderBranding';
import { AppHeaderToolbar } from './AppHeaderToolbar';

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
      <div className="app-screen-header-brand-row">
        <AppHeaderBranding trailing={brandingTrailing} logoSize={18} />
      </div>

      <AppHeaderToolbar
        left={navMenu}
        title={title}
        showTitle={showTitle}
        right={
          <>
            {notifications}
            {!hideAccountMenu ? <AccountMenu {...accountMenu} /> : null}
          </>
        }
      />

      {extension ? <div className="app-screen-header-extension">{extension}</div> : null}
    </header>
  );
}
