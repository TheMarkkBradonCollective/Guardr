import React, { useMemo } from 'react';
import { Logo } from '../../Logo';
import { AccountMenu, type AccountMenuProps } from '../AccountMenu';
import { BottomNavItem } from '../BottomNavBar';

interface DesktopTopShellProps {
  title: string;
  accountMenu: AccountMenuProps;
  navItems: BottomNavItem[];
  overflowNavItems?: BottomNavItem[];
  activeNavId: string;
  onNavigate: (id: string) => void;
  children: React.ReactNode;
  notifications?: React.ReactNode;
  headerRight?: React.ReactNode;
  fullBleed?: boolean;
  hideHeader?: boolean;
  headerExtension?: React.ReactNode;
  headerOverride?: React.ReactNode;
  variant?: 'default' | 'dark';
}

export function DesktopTopShell({
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
}: DesktopTopShellProps) {
  const isMapMode = variant === 'dark';
  const allNav = useMemo(() => [...navItems, ...overflowNavItems], [navItems, overflowNavItems]);

  return (
    <div
      className={`dsk-app page-shell fixed inset-0 flex flex-col h-dvh max-h-dvh overflow-hidden bg-[var(--dsk-bg)] text-brand-text ${
        isMapMode ? 'dsk-app--map' : ''
      }`}
    >
      <header className="dsk-app-topbar shrink-0">
        <div className="dsk-app-topbar-brand">
          <Logo size={24} className="text-brand-primary shrink-0" />
          <span className="dsk-app-topbar-wordmark">
            Guard<span className="text-brand-primary">r</span>
          </span>
        </div>

        <nav className="dsk-app-topbar-nav" aria-label="Main navigation">
          {allNav.map(({ id, label, icon: Icon, badge }) => {
            const active = activeNavId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                className={`dsk-app-topbar-tab${active ? ' dsk-app-topbar-tab--active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="dsk-app-topbar-tab-icon" strokeWidth={active ? 2.25 : 1.85} />
                <span>{label}</span>
                {badge != null && badge > 0 ? (
                  <span className="dsk-app-topbar-badge">{badge > 99 ? '99+' : badge}</span>
                ) : null}
              </button>
            );
          })}
        </nav>

        <div className="dsk-app-topbar-actions">
          {notifications ?? headerRight}
          <AccountMenu {...accountMenu} />
        </div>
      </header>

      {!hideHeader ? (
        headerOverride ? (
          <div className="dsk-app-subheader-slot shrink-0">{headerOverride}</div>
        ) : (
          <div className="dsk-app-subheader shrink-0">
            <div className="dsk-app-subheader-main">
              <p className="dsk-app-subheader-eyebrow">Workspace</p>
              <h1 className="dsk-app-subheader-title">{title}</h1>
            </div>
            <div className="dsk-app-subheader-meta">
              <span className="dsk-app-live-badge">
                <span className="dsk-app-live-dot" />
                Live
              </span>
            </div>
          </div>
        )
      ) : null}

      {headerExtension ? <div className="dsk-app-subheader-extension shrink-0">{headerExtension}</div> : null}

      <main className="dsk-app-main flex-1 min-h-0 min-w-0 overflow-hidden">
        <div className="dsk-app-main-inner h-full min-h-0 min-w-0 overflow-hidden">{children}</div>
      </main>
    </div>
  );
}
