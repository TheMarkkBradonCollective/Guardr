import React, { useMemo } from 'react';
import { AccountMenu, type AccountMenuProps } from './AccountMenu';
import { BottomNavItem } from './BottomNavBar';
import { GuardrDrawerShell } from '../baseui/layout/GuardrDrawerShell';
import { useDevice } from '../../lib/platform';

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

const MOBILE_BOTTOM_TAB_COUNT = 4;

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
  const isMapMode = variant === 'dark';
  const isMobileShell = formFactor === 'mobile';

  const navGroups = useMemo(
    () => [
      { title: 'Menu', items: navItems },
      ...(overflowNavItems.length > 0 ? [{ title: 'Account', items: overflowNavItems }] : []),
    ],
    [navItems, overflowNavItems],
  );

  const mobileBottomNavItems = useMemo(
    () => (isMobileShell ? navItems.slice(0, MOBILE_BOTTOM_TAB_COUNT) : undefined),
    [isMobileShell, navItems],
  );

  const mobileBottomNavOverflow = useMemo(() => {
    if (!isMobileShell) return undefined;
    const rest = navItems.slice(MOBILE_BOTTOM_TAB_COUNT);
    return [...rest, ...overflowNavItems];
  }, [isMobileShell, navItems, overflowNavItems]);

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
      mobileBottomNavItems={mobileBottomNavItems}
      mobileBottomNavOverflow={mobileBottomNavOverflow}
    >
      {children}
    </GuardrDrawerShell>
  );
}

export type { BottomNavItem };
