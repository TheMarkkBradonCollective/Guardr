import React, { useMemo } from 'react';
import { AccountMenu, type AccountMenuProps } from './AccountMenu';
import { BottomNavItem } from './BottomNavBar';
import { GuardrDrawerShell } from '../baseui/layout/GuardrDrawerShell';

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
  const isMapMode = variant === 'dark';

  const navGroups = useMemo(
    () => [
      { title: 'Menu', items: navItems },
      ...(overflowNavItems.length > 0 ? [{ title: 'Account', items: overflowNavItems }] : []),
    ],
    [navItems, overflowNavItems],
  );

  return (
    <GuardrDrawerShell
      workspaceLabel={workspaceLabel ?? 'Client workspace'}
      title={title}
      navGroups={navGroups}
      activeNavId={activeNavId}
      onNavigate={onNavigate}
      accountMenu={<AccountMenu {...accountMenu} />}
      notifications={notifications ?? headerRight}
      hideHeader={hideHeader}
      headerExtension={headerExtension}
      headerOverride={headerOverride}
      bleed={fullBleed || isMapMode}
      variant={variant}
      onSettingsClick={accountMenu.onOpenSettings}
    >
      {children}
    </GuardrDrawerShell>
  );
}

export type { BottomNavItem };
