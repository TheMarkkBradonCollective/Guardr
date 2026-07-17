import React, { useMemo, useState } from 'react';
import { AppScreenHeader } from './AppScreenHeader';
import { BottomNavBar, BottomNavItem } from './BottomNavBar';
import { MoreMenuSheet } from './MoreMenuSheet';
import { AccountMenu, type AccountMenuProps } from './AccountMenu';
import { AppHeaderBranding } from './AppHeaderBranding';
import { AppHeaderToolbar } from './AppHeaderToolbar';
import { useDevice } from '../../lib/platform';
import { DesktopAdminShell } from './desktop/DesktopAdminShell';
import { TabletAdminShell } from './tablet/TabletAdminShell';

interface RoleAppShellProps {
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
  fullBleed?: boolean;
  hideHeader?: boolean;
  headerExtension?: React.ReactNode;
  headerOverride?: React.ReactNode;
  variant?: 'default' | 'dark';
  workspaceLabel?: string;
}

function splitMobileNav(navItems: BottomNavItem[], overflowNavItems: BottomNavItem[]) {
  const hasOverflow = overflowNavItems.length > 0 || navItems.length > 4;
  const bottomPrimary = hasOverflow ? navItems.slice(0, 4) : navItems.slice(0, 5);
  const moreItems = hasOverflow ? [...navItems.slice(4), ...overflowNavItems] : overflowNavItems;
  return { bottomPrimary, moreItems, hasOverflow };
}

export function RoleAppShell({
  title,
  accountMenu,
  navItems,
  overflowNavItems = [],
  activeNavId,
  onNavigate,
  children,
  notifications,
  headerRight,
  fullBleed = false,
  hideHeader = false,
  headerExtension,
  headerOverride,
  variant = 'default',
  workspaceLabel,
}: RoleAppShellProps) {
  const { formFactor } = useDevice();
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const allSideNavItems = useMemo(
    () => [...navItems, ...overflowNavItems],
    [navItems, overflowNavItems],
  );

  const popoverItems = useMemo(
    () =>
      allSideNavItems.map(({ id, label, icon, badge }) => ({
        id,
        label,
        icon,
        badge,
      })),
    [allSideNavItems],
  );

  const { bottomPrimary, moreItems, hasOverflow } = useMemo(
    () => splitMobileNav(navItems, overflowNavItems),
    [navItems, overflowNavItems],
  );

  const moreActive = moreItems.some((item) => item.id === activeNavId);
  const moreBadge = moreItems.reduce((sum, item) => sum + (item.badge ?? 0), 0);
  const showBottomNav = navItems.length > 0;

  if (formFactor === 'desktop') {
    return (
      <DesktopAdminShell
        title={title}
        accountMenu={accountMenu}
        navItems={navItems}
        overflowNavItems={overflowNavItems}
        activeNavId={activeNavId}
        onNavigate={onNavigate}
        notifications={notifications}
        headerRight={headerRight}
        hideHeader={hideHeader}
        headerExtension={headerExtension}
        headerOverride={headerOverride}
        variant={variant}
        workspaceLabel={workspaceLabel ?? 'Client workspace'}
      >
        {children}
      </DesktopAdminShell>
    );
  }

  if (formFactor === 'tablet') {
    return (
      <TabletAdminShell
        title={title}
        accountMenu={accountMenu}
        navItems={navItems}
        overflowNavItems={overflowNavItems}
        activeNavId={activeNavId}
        onNavigate={onNavigate}
        notifications={notifications}
        headerRight={headerRight}
        hideHeader={hideHeader}
        headerExtension={headerExtension}
        headerOverride={headerOverride}
        variant={variant}
        workspaceLabel={workspaceLabel ?? 'Client workspace'}
      >
        {children}
      </TabletAdminShell>
    );
  }

  const dockedSidebar = false;
  const isMapMode = variant === 'dark';

  const sidebarPanel = (
    <>
      <nav className="role-side-nav-items" role="navigation">
        {allSideNavItems.map(({ id, label, icon: Icon, badge }) => {
          const active = activeNavId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
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
      className={`role-app-shell page-shell fixed inset-0 flex flex-col h-dvh max-h-dvh overflow-hidden bg-brand-bg text-brand-text ${
        dockedSidebar ? 'role-app-shell--docked' : 'role-app-shell--compact'
      }${showBottomNav ? ' role-app-shell--bottom-nav' : ''}`}
    >
      <div className="role-main flex-1 flex flex-col min-w-0 min-h-0 w-full">
        {headerOverride ? (
          <div className="app-screen-header-slot shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))] border-b border-brand-border bg-brand-surface">
            {headerOverride}
          </div>
        ) : !hideHeader ? (
          <AppScreenHeader
            title={title}
            accountMenu={accountMenu}
            notifications={notifications ?? headerRight}
            extension={headerExtension}
            hideAccountMenu={dockedSidebar}
            className={isMapMode ? 'app-screen-header--map bg-brand-bg/90 backdrop-blur-xl' : undefined}
          />
        ) : (
          <header className="app-screen-header app-screen-header--compact shrink-0 border-b border-brand-border bg-brand-bg/95 backdrop-blur-xl z-[1200]">
            <div className="app-screen-header-brand-row">
              <AppHeaderBranding logoSize={18} />
            </div>
            <AppHeaderToolbar
              showTitle={false}
              right={
                <>
                  {notifications ?? headerRight}
                  {!dockedSidebar ? <AccountMenu {...accountMenu} /> : null}
                </>
              }
            />
          </header>
        )}

        <main className="flex-1 min-h-0 min-w-0 overflow-hidden">
          <div className="h-full max-w-full min-w-0 overflow-hidden">
            {children}
          </div>
        </main>
      </div>

      {showBottomNav ? (
        <BottomNavBar
          items={bottomPrimary}
          activeId={activeNavId}
          onNavigate={onNavigate}
          showMore={hasOverflow}
          moreActive={moreActive}
          moreBadge={moreBadge}
          onMoreClick={() => setMoreMenuOpen(true)}
          flat={isMapMode}
          centerItemId="map"
        />
      ) : null}

      {hasOverflow ? (
        <MoreMenuSheet
          open={moreMenuOpen}
          items={moreItems}
          activeId={activeNavId}
          onNavigate={onNavigate}
          onClose={() => setMoreMenuOpen(false)}
        />
      ) : null}

      {dockedSidebar ? (
        <aside className="role-side-nav role-side-nav--docked" aria-label="Main navigation">
          {sidebarPanel}
        </aside>
      ) : null}
    </div>
  );
}

export type { BottomNavItem };
