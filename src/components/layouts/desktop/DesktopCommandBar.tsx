import React from 'react';
import { AccountMenu, type AccountMenuProps } from '../AccountMenu';

interface DesktopCommandBarProps {
  title: string;
  subtitle?: string;
  notifications?: React.ReactNode;
  extension?: React.ReactNode;
  accountMenu?: AccountMenuProps;
  variant?: 'default' | 'map';
  showAccountMenu?: boolean;
}

export function DesktopCommandBar({
  title,
  subtitle,
  notifications,
  extension,
  accountMenu,
  variant = 'default',
  showAccountMenu = true,
}: DesktopCommandBarProps) {
  return (
    <header
      className={`desktop-command-bar shrink-0 ${
        variant === 'map' ? 'desktop-command-bar--map' : ''
      }${extension ? ' desktop-command-bar--extended' : ''}`}
    >
      <div className="desktop-command-bar-primary">
        <div className="desktop-command-bar-titles">
          <h1 className="desktop-command-bar-title">{title}</h1>
          {subtitle ? <p className="desktop-command-bar-subtitle">{subtitle}</p> : null}
        </div>
        <div className="desktop-command-bar-actions">
          {notifications}
          {showAccountMenu && accountMenu ? <AccountMenu {...accountMenu} /> : null}
        </div>
      </div>
      {extension ? <div className="desktop-command-bar-extension">{extension}</div> : null}
    </header>
  );
}
