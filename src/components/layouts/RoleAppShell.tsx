import React, { useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AccountMenu, type AccountMenuProps } from './AccountMenu';
import { GuardrDrawerShell, type SidebarPrimaryAction } from '../baseui/layout/GuardrDrawerShell';
import type { SurfacePrimaryAction } from '../../surfaces/surfaceShellTypes';
import { useSurface } from '../../surfaces/SurfaceProvider';
import { SurfaceAppShell } from '../../surfaces/SurfaceAppShell';
import type { SurfaceDestination } from '../../surfaces/surfaceNavigation';
import { MobileDrawerIdentity } from './MobileDrawerIdentity';

/**
 * A destination a role can reach.
 *
 * Position-free on purpose for tablet/desktop: this says nothing about tabs,
 * sidebars, or rails, so each surface can arrange the same list its own way.
 * Mobile keeps the pre-remaster drawer + bottom-nav chrome.
 */
export interface RoleNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

/** @deprecated Name predates the three-surface split. Use `RoleNavItem`. */
export type BottomNavItem = RoleNavItem;

interface RoleAppShellProps {
  title: string;
  accountMenu: AccountMenuProps;
  navItems: RoleNavItem[];
  overflowNavItems?: RoleNavItem[];
  messagesNavItems?: RoleNavItem[];
  activeNavId: string;
  onNavigate: (id: string) => void;
  children: React.ReactNode;
  notifications?: React.ReactNode;
  /** @deprecated Use notifications */
  headerRight?: React.ReactNode;
  fullBleed?: boolean;
  hideHeader?: boolean;
  /** Hide primary navigation (e.g. during an active job trip). */
  hideBottomNav?: boolean;
  headerExtension?: React.ReactNode;
  headerOverride?: React.ReactNode;
  variant?: 'default' | 'dark';
  workspaceLabel?: string;
  sidebarPrimaryAction?: SurfacePrimaryAction | SidebarPrimaryAction;
  sidebarFooter?: React.ReactNode;
  headerContext?: React.ReactNode;
}

const MOBILE_BOTTOM_TAB_COUNT = 4;

/**
 * Guard and client entry point into the three surface applications.
 *
 * Mobile keeps the original Guardr-style drawer sidebar + bottom footer nav.
 * Tablet and desktop load their own independent shells via `SurfaceAppShell`
 * so they never piggyback off the phone layout (or vice versa).
 */
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
  const { surface } = useSurface();
  const isMapMode = variant === 'dark';
  const isMobileShell = surface === 'mobile';
  const bleed = fullBleed || isMapMode;

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
    return allNavItems.slice(MOBILE_BOTTOM_TAB_COUNT);
  }, [isMobileShell, allNavItems]);

  const destinations = useMemo<SurfaceDestination[]>(() => {
    const build = (
      items: RoleNavItem[],
      section: string,
      options: { rankOffset?: number; quick?: boolean } = {},
    ): SurfaceDestination[] =>
      items.map((item, index) => ({
        id: item.id,
        label: item.label,
        icon: item.icon,
        badge: item.badge,
        section,
        mobileRank: options.rankOffset != null ? options.rankOffset + index : undefined,
        tabletQuick: options.quick,
      }));

    return [
      ...build(navItems, 'Work', { rankOffset: 1, quick: true }),
      ...build(messagesNavItems, 'Messages', { rankOffset: 100 }),
      ...build(overflowNavItems, 'Manage'),
    ];
  }, [navItems, messagesNavItems, overflowNavItems]);

  // Mobile: restore the original drawer + bottom-nav application.
  if (isMobileShell) {
    return (
      <GuardrDrawerShell
        forceLayout="mobile"
        workspaceLabel={workspaceLabel ?? 'Client workspace'}
        title={title}
        navGroups={navGroups}
        activeNavId={activeNavId}
        onNavigate={onNavigate}
        accountMenu={<AccountMenu {...accountMenu} triggerVariant="default" />}
        notifications={notifications ?? headerRight}
        hideHeader={hideHeader}
        headerExtension={headerExtension}
        headerOverride={headerOverride}
        bleed={bleed}
        variant={variant}
        mobileBottomNavItems={hideBottomNav ? undefined : mobileBottomNavItems}
        mobileBottomNavOverflow={hideBottomNav ? undefined : mobileBottomNavOverflow}
        sidebarPrimaryAction={sidebarPrimaryAction}
        sidebarFooter={sidebarFooter}
        sidebarIdentity={
          <MobileDrawerIdentity
            userName={accountMenu.userName}
            avatarUrl={accountMenu.avatarUrl}
            onClick={accountMenu.hideProfile ? accountMenu.onOpenSettings : accountMenu.onOpenProfile}
          />
        }
        headerContext={headerContext}
      >
        {children}
      </GuardrDrawerShell>
    );
  }

  return (
    <SurfaceAppShell
      title={title}
      workspaceLabel={workspaceLabel ?? 'Client workspace'}
      destinations={destinations}
      activeId={activeNavId}
      onNavigate={onNavigate}
      notifications={notifications ?? headerRight}
      accountMenu={
        <AccountMenu
          {...accountMenu}
          triggerVariant={surface === 'desktop' ? 'uber-direct' : 'default'}
        />
      }
      navFooter={sidebarFooter}
      headerExtension={headerExtension}
      headerOverride={headerOverride}
      pageActions={headerContext}
      primaryAction={sidebarPrimaryAction}
      hideChrome={hideHeader}
      hidePrimaryNav={hideBottomNav}
      bleed={bleed}
    >
      {children}
    </SurfaceAppShell>
  );
}
