import React, { useMemo } from 'react';
import { AccountMenu, type AccountMenuProps } from './AccountMenu';
import { BottomNavItem } from './BottomNavBar';
import { GuardrDrawerShell, type SidebarPrimaryAction } from '../baseui/layout/GuardrDrawerShell';
import { useDevice } from '../../lib/platform';
import { MobileDrawerIdentity } from './MobileDrawerIdentity';

interface RoleAppShellProps {
  title: string;
  accountMenu: AccountMenuProps;
  navItems: BottomNavItem[];
  overflowNavItems?: BottomNavItem[];
  messagesNavItems?: BottomNavItem[];
  activeNavId: string;
  onNavigate: (id: string) => void;
  children: React.ReactNode;
  notifications?: React.ReactNode;
  /** @deprecated Use notifications */
  headerRight?: React.ReactNode;
  fullBleed?: boolean;
  hideHeader?: boolean;
  /** Hide mobile bottom nav (e.g. during an active job trip). */
  hideBottomNav?: boolean;
  headerExtension?: React.ReactNode;
  headerOverride?: React.ReactNode;
  variant?: 'default' | 'dark';
  workspaceLabel?: string;
  sidebarPrimaryAction?: SidebarPrimaryAction;
  sidebarFooter?: React.ReactNode;
  headerContext?: React.ReactNode;
}

const MOBILE_BOTTOM_TAB_COUNT = 4;

export function RoleAppShell({
  title,
  accountMenu,
  navItems,
  overflowNavItems = [],
  messagesNavItems = [],
  activeNavId,
  onNavigate,
  children,
  notifications,
  headerRight,
  fullBleed = false,
  hideHeader = false,
  hideBottomNav = false,
  headerExtension,
  headerOverride,
  variant = 'default',
  workspaceLabel,
  sidebarPrimaryAction,
  sidebarFooter,
  headerContext,
}: RoleAppShellProps) {
  const { formFactor } = useDevice();
  const isMapMode = variant === 'dark';
  const isMobileShell = formFactor === 'mobile';
  const isDesktopShell = formFactor === 'desktop';

  const navGroups = useMemo(
    () => [
      { items: navItems },
      ...(messagesNavItems.length > 0 ? [{ title: 'Messages', items: messagesNavItems }] : []),
      ...(overflowNavItems.length > 0 ? [{ title: 'Management', items: overflowNavItems }] : []),
    ],
    [navItems, messagesNavItems, overflowNavItems],
  );

  const allNavItems = useMemo(
    () => [...navItems, ...messagesNavItems, ...overflowNavItems],
    [navItems, messagesNavItems, overflowNavItems],
  );

  const mobileBottomNavItems = useMemo(
    () => (isMobileShell ? allNavItems.slice(0, MOBILE_BOTTOM_TAB_COUNT) : undefined),
    [isMobileShell, allNavItems],
  );

  const mobileBottomNavOverflow = useMemo(() => {
    if (!isMobileShell) return undefined;
    const rest = allNavItems.slice(MOBILE_BOTTOM_TAB_COUNT);
    return rest;
  }, [isMobileShell, allNavItems]);

  return (
    <GuardrDrawerShell
      workspaceLabel={workspaceLabel ?? 'Client workspace'}
      title={title}
      navGroups={navGroups}
      activeNavId={activeNavId}
      onNavigate={onNavigate}
      accountMenu={<AccountMenu {...accountMenu} triggerVariant={isDesktopShell ? 'uber-direct' : 'default'} />}
      notifications={notifications ?? headerRight}
      hideHeader={hideHeader}
      headerExtension={headerExtension}
      headerOverride={headerOverride}
      bleed={fullBleed || isMapMode}
      variant={variant}
      mobileBottomNavItems={hideBottomNav ? undefined : mobileBottomNavItems}
      mobileBottomNavOverflow={hideBottomNav ? undefined : mobileBottomNavOverflow}
      sidebarPrimaryAction={sidebarPrimaryAction}
      sidebarFooter={sidebarFooter}
      sidebarIdentity={
        isMobileShell ? (
          <MobileDrawerIdentity
            userName={accountMenu.userName}
            avatarUrl={accountMenu.avatarUrl}
            onClick={accountMenu.hideProfile ? accountMenu.onOpenSettings : accountMenu.onOpenProfile}
          />
        ) : undefined
      }
      headerContext={headerContext}
    >
      {children}
    </GuardrDrawerShell>
  );
}

export type { BottomNavItem };
