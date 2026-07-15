import React, { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AppScreenHeader } from './AppScreenHeader';
import { BottomNavItem } from './BottomNavBar';
import { AccountMenu, type AccountMenuProps } from './AccountMenu';
import { Logo } from '../Logo';
import { BREAKPOINTS, useMediaQuery } from '../../lib/platform';

interface RoleAppShellProps {
  title: string;
  subtitle?: string;
  locationLabel?: string;
  accountMenu: AccountMenuProps;
  navItems: BottomNavItem[];
  overflowNavItems?: BottomNavItem[];
  activeNavId: string;
  onNavigate: (id: string) => void;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  fullBleed?: boolean;
  hideHeader?: boolean;
  headerExtension?: React.ReactNode;
  headerOverride?: React.ReactNode;
  variant?: 'default' | 'dark';
}

export function RoleAppShell({
  title,
  subtitle,
  locationLabel,
  accountMenu,
  navItems,
  overflowNavItems = [],
  activeNavId,
  onNavigate,
  children,
  headerRight,
  fullBleed = false,
  hideHeader = false,
  headerExtension,
  headerOverride,
  variant = 'default',
}: RoleAppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const dockedSidebar = useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`);
  const isMapMode = variant === 'dark';

  useEffect(() => {
    if (!mobileNavOpen || dockedSidebar) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileNavOpen, dockedSidebar]);

  const navigate = (id: string) => {
    onNavigate(id);
    setMobileNavOpen(false);
  };

  const allSideNavItems = [...navItems, ...overflowNavItems];

  const sidebarPanel = (
    <>
      {!dockedSidebar ? (
        <button
          type="button"
          className="role-side-nav-close"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      ) : null}
      <div className="role-side-nav-brand">
        <Logo size={26} className="text-brand-primary shrink-0" />
        <span className="role-side-nav-brand-name">
          Guard<span className="role-side-nav-brand-accent">r</span>
        </span>
      </div>

      <nav className="role-side-nav-items" role="navigation">
        {allSideNavItems.map(({ id, label, icon: Icon, badge }) => {
          const active = activeNavId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => navigate(id)}
              className={`role-side-nav-item${active ? ' role-side-nav-item-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon
                className="role-side-nav-item-icon"
                strokeWidth={active ? 2.5 : 2}
              />
              <span className="role-side-nav-item-label">{label}</span>
              {badge != null && badge > 0 ? (
                <span className="role-side-nav-item-badge">
                  {badge > 9 ? '9+' : badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="role-side-nav-footer">
        <AccountMenu {...accountMenu} />
      </div>
    </>
  );

  return (
    <div
      className={`role-app-shell page-shell fixed inset-0 flex h-dvh max-h-dvh overflow-hidden bg-brand-bg text-brand-text ${
        dockedSidebar ? 'role-app-shell--docked' : 'role-app-shell--compact'
      }${mobileNavOpen && !dockedSidebar ? ' role-app-shell--nav-open' : ''}`}
    >
      {dockedSidebar ? (
        <aside className="role-side-nav role-side-nav--docked" aria-label="Main navigation">
          {sidebarPanel}
        </aside>
      ) : (
        mobileNavOpen && (
          <>
            <button
              type="button"
              className="role-side-nav-backdrop"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation"
            />
            <aside
              className="role-side-nav role-side-nav--overlay role-side-nav--open"
              role="dialog"
              aria-modal="true"
              aria-label="Main navigation"
            >
              {sidebarPanel}
            </aside>
          </>
        )
      )}

      <div className="role-main flex-1 flex flex-col min-w-0 min-h-0 w-full">
        {headerOverride ? (
          <div className="app-screen-header-slot shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))] border-b border-brand-border bg-brand-surface">
            {headerOverride}
          </div>
        ) : !hideHeader ? (
          <AppScreenHeader
            title={title}
            subtitle={subtitle}
            locationLabel={locationLabel}
            accountMenu={accountMenu}
            right={headerRight}
            extension={headerExtension}
            onMenuClick={dockedSidebar ? undefined : () => setMobileNavOpen(true)}
            hideAccountMenu={dockedSidebar}
            className={isMapMode ? 'app-screen-header--map bg-brand-bg/90 backdrop-blur-xl' : undefined}
          />
        ) : (
          <header className="app-screen-header app-screen-header--compact shrink-0 px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2.5 flex items-center justify-between gap-2 border-b border-brand-border bg-brand-bg/95 backdrop-blur-xl z-[1200]">
            {!dockedSidebar ? (
              <button
                type="button"
                className="app-chrome-btn -ml-1 text-brand-text"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2">
              {headerRight}
              {!dockedSidebar ? <AccountMenu {...accountMenu} /> : null}
            </div>
          </header>
        )}

        <main className="flex-1 min-h-0 min-w-0 overflow-hidden">
          <div className="h-full max-w-full min-w-0 overflow-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export type { BottomNavItem };
