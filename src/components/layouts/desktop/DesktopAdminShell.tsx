import React, { useMemo } from 'react';
import { Search, Settings } from 'lucide-react';
import { Logo } from '../../Logo';
import { AccountMenu, type AccountMenuProps } from '../AccountMenu';
import { BottomNavItem } from '../BottomNavBar';

interface DesktopAdminShellProps {
  title: string;
  accountMenu: AccountMenuProps;
  navItems: BottomNavItem[];
  overflowNavItems?: BottomNavItem[];
  activeNavId: string;
  onNavigate: (id: string) => void;
  children: React.ReactNode;
  notifications?: React.ReactNode;
  headerRight?: React.ReactNode;
  hideHeader?: boolean;
  headerExtension?: React.ReactNode;
  headerOverride?: React.ReactNode;
  variant?: 'default' | 'dark';
  workspaceLabel?: string;
}

export function DesktopAdminShell({
  title,
  accountMenu,
  navItems,
  overflowNavItems = [],
  activeNavId,
  onNavigate,
  children,
  notifications,
  headerRight,
  hideHeader = false,
  headerExtension,
  headerOverride,
  variant = 'default',
  workspaceLabel = 'Client workspace',
}: DesktopAdminShellProps) {
  const isMapMode = variant === 'dark';

  const menuItems = useMemo(() => navItems, [navItems]);
  const accountItems = useMemo(() => overflowNavItems, [overflowNavItems]);

  const renderNavItem = ({ id, label, icon: Icon, badge }: BottomNavItem) => {
    const active = activeNavId === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => onNavigate(id)}
        className={`adm-sidebar-item${active ? ' adm-sidebar-item--active' : ''}`}
        aria-current={active ? 'page' : undefined}
      >
        <Icon className="adm-sidebar-item-icon" strokeWidth={active ? 2.25 : 1.85} />
        <span className="adm-sidebar-item-label">{label}</span>
        {badge != null && badge > 0 ? (
          <span className="adm-sidebar-badge">{badge > 99 ? '99+' : badge}</span>
        ) : null}
      </button>
    );
  };

  return (
    <div className={`adm-app page-shell fixed inset-0 flex h-dvh max-h-dvh overflow-hidden ${isMapMode ? 'adm-app--map' : ''}`}>
      <aside className="adm-sidebar" aria-label="Main navigation">
        <div className="adm-sidebar-brand">
          <Logo size={26} className="adm-logo shrink-0" />
          <span className="adm-sidebar-wordmark">
            Guard<span className="adm-accent-text">r</span>
          </span>
        </div>

        <p className="adm-sidebar-section">Menu</p>
        <nav className="adm-sidebar-nav">{menuItems.map(renderNavItem)}</nav>

        {accountItems.length > 0 ? (
          <>
            <p className="adm-sidebar-section">Account</p>
            <nav className="adm-sidebar-nav">{accountItems.map(renderNavItem)}</nav>
          </>
        ) : null}

        <div className="adm-sidebar-footer">
          <AccountMenu {...accountMenu} />
        </div>
      </aside>

      <div className="adm-main">
        <header className="adm-header">
          <label className="adm-search">
            <Search className="adm-search-icon" />
            <input type="search" placeholder="Search jobs, guards, sites…" className="adm-search-input" />
          </label>
          <div className="adm-header-actions">
            {notifications ?? headerRight}
            <AccountMenu {...accountMenu} />
            <button
              type="button"
              className="adm-header-icon-btn"
              onClick={accountMenu.onOpenSettings}
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </header>

        {!hideHeader ? (
          headerOverride ? (
            <div className="adm-hero-slot">{headerOverride}</div>
          ) : (
            <div className="adm-hero">
              <div>
                <h1 className="adm-hero-title">{title}</h1>
                <p className="adm-hero-sub">Welcome to {workspaceLabel}</p>
              </div>
            </div>
          )
        ) : null}

        {headerExtension ? <div className="adm-hero-extension">{headerExtension}</div> : null}

        <main className={`adm-content${isMapMode ? ' adm-content--bleed' : ''}`}>
          <div className="adm-content-inner">{children}</div>
        </main>
      </div>
    </div>
  );
}
