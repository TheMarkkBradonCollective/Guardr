import React, { useCallback, useMemo, useState } from 'react';
import { PanelLeft, Settings } from 'lucide-react';
import { Logo } from '../../Logo';
import { AccountMenu, type AccountMenuProps } from '../AccountMenu';
import { BottomNavItem } from '../BottomNavBar';
import { GuardrSideNav } from '../../baseui/layout/GuardrSideNav';

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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMapMode = variant === 'dark';

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setSidebarOpen((open) => !open), []);

  const navGroups = useMemo(
    () => [
      { title: 'Menu', items: navItems },
      ...(overflowNavItems.length > 0 ? [{ title: 'Account', items: overflowNavItems }] : []),
    ],
    [navItems, overflowNavItems],
  );

  const handleNavigate = (id: string) => {
    onNavigate(id);
    closeSidebar();
  };

  return (
    <div
      className={`adm-app page-shell fixed inset-0 flex h-dvh max-h-dvh overflow-hidden ${isMapMode ? 'adm-app--map' : ''}${sidebarOpen ? ' adm-app--sidebar-open' : ''}`}
    >
      {sidebarOpen ? (
        <button
          type="button"
          className="adm-sidebar-backdrop"
          onClick={closeSidebar}
          aria-label="Close navigation"
        />
      ) : null}

      <aside
        className={`adm-sidebar adm-sidebar--drawer${sidebarOpen ? ' adm-sidebar--open' : ''}`}
        aria-label="Main navigation"
        aria-hidden={!sidebarOpen}
      >
        <div className="adm-sidebar-brand">
          <Logo size={26} className="adm-logo shrink-0" />
          <span className="adm-sidebar-wordmark">
            Guard<span className="adm-accent-text">r</span>
          </span>
        </div>

        <div className="adm-sidebar-nav adm-sidebar-nav--baseui">
          <GuardrSideNav groups={navGroups} activeId={activeNavId} onSelect={handleNavigate} />
        </div>

        <div className="adm-sidebar-footer">
          <AccountMenu {...accountMenu} />
        </div>
      </aside>

      <div className="adm-main" onClick={sidebarOpen ? closeSidebar : undefined}>
        <header className="adm-header" onClick={(e) => e.stopPropagation()}>
          <div className="adm-header-brand">
            <button
              type="button"
              className="adm-header-icon-btn"
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={sidebarOpen}
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            <Logo size={24} className="adm-logo shrink-0" />
            <div className="adm-header-brand-text">
              <span className="adm-header-wordmark">
                Guard<span className="adm-accent-text">r</span>
              </span>
              <span className="adm-header-suite">{workspaceLabel}</span>
            </div>
          </div>
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
