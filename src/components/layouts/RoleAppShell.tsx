import React, { useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { AccountMenu, type AccountMenuProps } from './AccountMenu';
import type { SurfacePrimaryAction } from '../../surfaces/surfaceShellTypes';
import { useSurface } from '../../surfaces/SurfaceProvider';
import { SurfaceAppShell } from '../../surfaces/SurfaceAppShell';
import type { SurfaceDestination } from '../../surfaces/surfaceNavigation';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import type { SidebarPrimaryAction } from '../baseui/layout/GuardrDrawerShell';
import type { ProductApp } from '../../lib/productApps';
import { AppInstallBanner } from '../apps/AppInstallBanner';

/**
 * A destination a role can reach.
 *
 * Position-free on purpose: this says nothing about tabs, sidebars, or rails,
 * so each surface can arrange the same list its own way.
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
  /** Which product app this shell belongs to — never mix roles. */
  productApp?: Exclude<ProductApp, 'website'>;
  /** Guard/Client use thumb tabs on phone; staff keeps a drawer. */
  mobilePrimaryNav?: 'tabs' | 'drawer';
  mobileTabRanks?: Record<string, number>;
}

/**
 * Guard and client entry point into the three surface applications.
 *
 * Mobile, tablet, and desktop each load their own independent shell via
 * `SurfaceAppShell`. Guard and Client use thumb-first bottom tabs on phone;
 * Staff keeps a destination drawer because the catalog is much larger.
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
  productApp = 'client',
  mobilePrimaryNav = 'tabs',
  mobileTabRanks,
}: RoleAppShellProps) {
  const { surface } = useSurface();
  const isMapMode = variant === 'dark';
  const bleed = fullBleed || isMapMode;

  const destinations = useMemo<SurfaceDestination[]>(() => {
    const build = (
      items: RoleNavItem[],
      section: string,
      options: { quick?: boolean } = {},
    ): SurfaceDestination[] =>
      items.map((item) => ({
        id: item.id,
        label: item.label,
        icon: item.icon,
        badge: item.badge,
        section,
        tabletQuick: options.quick,
        mobileRank: mobileTabRanks?.[item.id],
      }));

    return [
      ...build(navItems, productApp === 'guard' ? 'Field' : 'Work', { quick: true }),
      ...build(messagesNavItems, 'Messages'),
      ...build(overflowNavItems, productApp === 'guard' ? 'Account' : 'Manage'),
    ];
  }, [navItems, messagesNavItems, overflowNavItems, productApp, mobileTabRanks]);

  return (
    <SurfaceAppShell
      title={title}
      workspaceLabel={
        workspaceLabel ??
        (productApp === 'guard' ? 'Guard App' : productApp === 'staff' ? 'Staff App' : 'Client App')
      }
      destinations={destinations}
      activeId={activeNavId}
      onNavigate={onNavigate}
      mobilePrimaryNav={mobilePrimaryNav}
      notifications={notifications ?? headerRight}
      identity={
        <ProfileAvatar
          src={accountMenu.avatarUrl}
          name={accountMenu.userName}
          size="sm"
          className="sfm-shell-avatar"
        />
      }
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
      <AppInstallBanner productApp={productApp} />
      {children}
    </SurfaceAppShell>
  );
}
