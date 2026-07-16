import React, { useMemo } from 'react';
import { AccountMenu, type AccountMenuProps } from '../AccountMenu';
import { BottomNavItem } from '../BottomNavBar';
import { DesktopCommandBar } from './DesktopCommandBar';
import { DesktopNavRail } from './DesktopNavRail';

interface DesktopWorkspaceShellProps {
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

export function DesktopWorkspaceShell({
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
}: DesktopWorkspaceShellProps) {
  const isMapMode = variant === 'dark';

  const primaryNav = useMemo(
    () =>
      navItems.map(({ id, label, icon, badge }) => ({
        id,
        label,
        icon,
        badge,
      })),
    [navItems],
  );

  const secondaryNav = useMemo(
    () =>
      overflowNavItems.map(({ id, label, icon, badge }) => ({
        id,
        label,
        icon,
        badge,
      })),
    [overflowNavItems],
  );

  const railFooter = (
    <div className="desktop-nav-rail-account">
      <AccountMenu {...accountMenu} />
      {accountMenu.footer}
    </div>
  );

  return (
    <div className="desktop-workspace page-shell fixed inset-0 h-dvh max-h-dvh overflow-hidden bg-brand-bg text-brand-text">
      <DesktopNavRail
        items={primaryNav}
        secondaryItems={secondaryNav}
        activeId={activeNavId}
        onNavigate={onNavigate}
        footer={railFooter}
        primaryLabel="Main"
        secondaryLabel="Account & tools"
      />

      <div className="desktop-workspace-main">
        {!hideHeader ? (
          headerOverride ? (
            <div className="desktop-command-bar-slot shrink-0">{headerOverride}</div>
          ) : (
            <DesktopCommandBar
              title={title}
              notifications={notifications ?? headerRight}
              extension={headerExtension}
              accountMenu={accountMenu}
              showAccountMenu={false}
              variant={isMapMode ? 'map' : 'default'}
            />
          )
        ) : null}

        <main
          className={`desktop-workspace-canvas${
            fullBleed || isMapMode ? ' desktop-workspace-canvas--bleed' : ''
          }`}
        >
          <div className="desktop-workspace-canvas-inner h-full min-h-0 min-w-0 overflow-hidden">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
