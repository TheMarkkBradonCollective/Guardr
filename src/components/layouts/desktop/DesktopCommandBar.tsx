import React from 'react';
import { AccountMenu, type AccountMenuProps } from '../AccountMenu';

interface DesktopCommandBarProps {
  title: string;
  subtitle?: string;
  breadcrumb?: string;
  notifications?: React.ReactNode;
  extension?: React.ReactNode;
  accountMenu?: AccountMenuProps;
  variant?: 'default' | 'map';
  showAccountMenu?: boolean;
  showLiveStatus?: boolean;
}

export function DesktopCommandBar({
  title,
  subtitle,
  breadcrumb = 'Workspace',
  notifications,
  extension,
  accountMenu,
  variant = 'default',
  showAccountMenu = true,
  showLiveStatus = true,
}: DesktopCommandBarProps) {
  return (
    <header
      className={`desktop-command-bar shrink-0 ${
        variant === 'map' ? 'desktop-command-bar--map' : ''
      }${extension ? ' desktop-command-bar--extended' : ''}`}
    >
      <div className="desktop-command-bar-primary">
        <div className="desktop-command-bar-context">
          <div className="desktop-command-bar-breadcrumb" aria-label="Location">
            <span className="desktop-command-bar-breadcrumb-root">Guardr</span>
            <span className="desktop-command-bar-breadcrumb-sep" aria-hidden>
              /
            </span>
            <span className="desktop-command-bar-breadcrumb-leaf">{breadcrumb}</span>
          </div>
          <div className="desktop-command-bar-titles">
            <h1 className="desktop-command-bar-title">{title}</h1>
            {subtitle ? <p className="desktop-command-bar-subtitle">{subtitle}</p> : null}
          </div>
        </div>
        <div className="desktop-command-bar-actions">
          {showLiveStatus ? (
            <span className="desktop-command-bar-status" aria-label="Platform live">
              <span className="desktop-command-bar-status-dot" />
              Live
            </span>
          ) : null}
          {notifications}
          {showAccountMenu && accountMenu ? <AccountMenu {...accountMenu} /> : null}
        </div>
      </div>
      {extension ? <div className="desktop-command-bar-extension">{extension}</div> : null}
    </header>
  );
}
