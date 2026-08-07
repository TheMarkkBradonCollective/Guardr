import React, { useMemo } from 'react';
import { AccountMenu, type AccountMenuProps } from './AccountMenu';
import { BottomNavItem } from './BottomNavBar';
import { type SidebarPrimaryAction } from '../baseui/layout/GuardrDrawerShell';
import { useSurface } from '../../surfaces/SurfaceProvider';
import { SurfaceAppShell } from '../../surfaces/SurfaceAppShell';
import type { SurfaceDestination } from '../../surfaces/surfaceNavigation';
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
  /** Hide primary navigation (e.g. during an active job trip). */
  hideBottomNav?: boolean;
  headerExtension?: React.ReactNode;
  headerOverride?: React.ReactNode;
  variant?: 'default' | 'dark';
  workspaceLabel?: string;
  sidebarPrimaryAction?: SidebarPrimaryAction;
  sidebarFooter?: React.ReactNode;
  headerContext?: React.ReactNode;
}

/**
 * Guard and client entry point into the three surface applications.
 *
 * This component's only job is translating the role's navigation into a
 * surface-agnostic destination list and handing it to `SurfaceAppShell`, which
 * loads the mobile, tablet, or desktop application. It deliberately does not
 * describe layout — the destination order carries the intent (`mobileRank` for
 * thumb order, `tabletQuick` for mid-shift switching, `section` for grouping) and
 * each surface arranges it its own way.
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

  const destinations = useMemo<SurfaceDestination[]>(() => {
    const build = (
      items: BottomNavItem[],
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
      // Primary items win the mobile tab slots and the tablet quick-switch row —
      // these are the destinations a guard or client uses while on a job.
      ...build(navItems, 'Work', { rankOffset: 1, quick: true }),
      ...build(messagesNavItems, 'Messages', { rankOffset: 100 }),
      ...build(overflowNavItems, 'Manage'),
    ];
  }, [navItems, messagesNavItems, overflowNavItems]);

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
      identity={
        surface === 'mobile' ? (
          <MobileDrawerIdentity
            userName={accountMenu.userName}
            avatarUrl={accountMenu.avatarUrl}
            onClick={accountMenu.hideProfile ? accountMenu.onOpenSettings : accountMenu.onOpenProfile}
          />
        ) : undefined
      }
      navFooter={sidebarFooter}
      headerExtension={headerExtension}
      headerOverride={headerOverride}
      pageActions={headerContext}
      primaryAction={sidebarPrimaryAction}
      hideChrome={hideHeader}
      hidePrimaryNav={hideBottomNav}
      bleed={fullBleed || isMapMode}
    >
      {children}
    </SurfaceAppShell>
  );
}

export type { BottomNavItem };
