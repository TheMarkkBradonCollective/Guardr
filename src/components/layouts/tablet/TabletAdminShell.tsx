import React, { useMemo } from 'react';
import { Logo } from '../../Logo';
import { AccountMenu, type AccountMenuProps } from '../AccountMenu';
import { BottomNavItem } from '../BottomNavBar';
import { DesktopCommandBar } from '../desktop/DesktopCommandBar';

interface TabletAdminShellProps {
  title: string;
  accountMenu: AccountMenuProps;
  navItems: BottomNavItem[];
  overflowNavItems?: BottomNavItem[];
  activeNavId: string;
  onNavigate: (id: string) => void;
  children: React.ReactNode;
  notifications?: React.ReactNode;
  /** @deprecated Use notifications */
  headerRight?: React.ReactNode;
  hideHeader?: boolean;
  headerExtension?: React.ReactNode;
  headerOverride?: React.ReactNode;
  variant?: 'default' | 'dark';
  workspaceLabel?: string;
}

/**
 * Tablet merge shell — desktop icon rail + command bar header + mobile-friendly content.
 * Used for browser, PWA, and APK at tablet widths.
 */
export function TabletAdminShell({
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
  workspaceLabel = 'Workspace',
}: TabletAdminShellProps) {
  const isMapMode = variant === 'dark';
  const allNavItems = useMemo(
    () => [...navItems, ...overflowNavItems],
    [navItems, overflowNavItems],
  );

  return (
    <div
      className={`tablet-admin-shell page-shell fixed inset-0 flex h-dvh max-h-dvh overflow-hidden bg-brand-bg text-brand-text ${
        isMapMode ? 'tablet-admin-shell--map' : ''
      }`}
    >
      <aside className="tablet-admin-rail" aria-label="Main navigation">
        <div className="tablet-admin-rail-brand">
          <Logo size={22} className="text-brand-primary shrink-0" />
          <span className="tablet-admin-rail-label">{workspaceLabel}</span>
        </div>
        <nav className="tablet-admin-rail-nav" role="navigation">
          {allNavItems.map(({ id, label, icon: Icon, badge }) => {
            const active = activeNavId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate(id)}
                className={`tablet-admin-rail-item${active ? ' tablet-admin-rail-item--active' : ''}`}
                aria-current={active ? 'page' : undefined}
                aria-label={label}
                title={label}
              >
                <Icon className="tablet-admin-rail-item-icon" strokeWidth={active ? 2.5 : 2} />
                {badge != null && badge > 0 ? (
                  <span className="tablet-admin-rail-item-badge">{badge > 9 ? '9+' : badge}</span>
                ) : null}
              </button>
            );
          })}
        </nav>
        <div className="tablet-admin-rail-footer">
          <AccountMenu {...accountMenu} />
        </div>
      </aside>

      <div className="tablet-admin-main flex-1 flex flex-col min-w-0 min-h-0">
        {headerOverride ? (
          <div className="tablet-admin-header-slot shrink-0">{headerOverride}</div>
        ) : !hideHeader ? (
          <DesktopCommandBar
            title={title}
            breadcrumb={workspaceLabel}
            notifications={notifications ?? headerRight}
            extension={headerExtension}
            accountMenu={accountMenu}
            showAccountMenu={false}
            showLiveStatus={false}
            variant={isMapMode ? 'map' : 'default'}
          />
        ) : null}

        <main className="tablet-admin-content flex-1 min-h-0 min-w-0 overflow-hidden">
          <div className="h-full max-w-full min-w-0 overflow-hidden">{children}</div>
        </main>
      </div>
    </div>
  );
}
