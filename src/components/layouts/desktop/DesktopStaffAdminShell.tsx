import React, { useMemo } from 'react';
import { Block } from 'baseui/block';
import { SessionUser } from '../../../types';
import { ROLE_LABELS } from '../../../lib/permissions';
import { isStaffOpsMapSection, isStaffMessagesHubSection, StaffSection } from '../../../lib/staffOps';
import { getStaffNavAccessNotice, isStaffNavItemVisible } from '../../../lib/staffNavAccess';
import type { LegalPageId } from '../../../lib/legalContent';
import type { ThemeMode } from '../../../lib/platform/theme';
import { AccountMenu, type AccountMenuNotificationProps } from '../AccountMenu';
import { SidebarFooterLinks } from '../SidebarFooterLinks';
import { StaffNavItem } from '../../staff/StaffSidebarNav';
import { showAppAlert } from '../../ui/AppConfirm';
import { GuardrDrawerShell, type SidebarPrimaryAction } from '../../baseui/layout/GuardrDrawerShell';
import type { SurfacePrimaryAction } from '../../../surfaces/surfaceShellTypes';
import { useSurface } from '../../../surfaces/SurfaceProvider';
import { SurfaceAppShell } from '../../../surfaces/SurfaceAppShell';
import type { SurfaceDestination } from '../../../surfaces/surfaceNavigation';
import { MobileDrawerIdentity } from '../MobileDrawerIdentity';

interface DesktopStaffAdminShellProps {
  children: React.ReactNode;
  currentUser: SessionUser;
  activeSection: StaffSection;
  onNavigate: (section: StaffSection) => void;
  onSignOut: () => void;
  isDbConnected: boolean;
  navItems: StaffNavItem[];
  screenTitle: string;
  navHighlight: StaffSection;
  showFinance: boolean;
  showPayments: boolean;
  showSettings: boolean;
  showPermissions: boolean;
  showDisputes: boolean;
  showCities: boolean;
  financeDeskOnly?: boolean;
  onOpenLegal?: (page: LegalPageId) => void;
  onOpenDownload?: () => void;
  hideHeader?: boolean;
  themeMode?: ThemeMode;
  onChangeTheme?: (mode: ThemeMode) => void;
  accountNotifications?: AccountMenuNotificationProps;
  headerExtension?: React.ReactNode;
  headerOverride?: React.ReactNode;
  sidebarPrimaryAction?: SurfacePrimaryAction | SidebarPrimaryAction;
  sidebarPrimaryActions?: Array<SurfacePrimaryAction | SidebarPrimaryAction>;
}

/** Section groups for drawer / rail / sidebar. */
const MENU_GROUPS: { label?: string; ids: StaffSection[] }[] = [
  { label: 'Dashboard', ids: ['overview', 'map'] },
  {
    label: 'Operations',
    ids: ['jobs', 'locations', 'applications', 'credentials', 'guards', 'clients', 'team'],
  },
  { label: 'Communications', ids: ['messages', 'support'] },
  { label: 'Management', ids: ['payments', 'payment-settings', 'agreements', 'audit-log'] },
  { label: 'Oversight', ids: ['incidents', 'violations', 'stats', 'disputes', 'analytics'] },
  { label: 'Platform', ids: ['cities', 'permissions', 'settings', 'integrations', 'guide', 'dev-updates'] },
];

/** Thumb-order tabs for the mobile staff app. Everything else lives in the drawer / More sheet. */
const MOBILE_TAB_ORDER: StaffSection[] = ['overview', 'jobs', 'guards', 'messages'];

/** Destinations pinned to the tablet quick-switch row — live ops, not admin. */
const TABLET_QUICK: StaffSection[] = ['overview', 'map', 'jobs'];

/** Pre-remaster staff bottom-nav order (drawer shell footer). */
const STAFF_BOTTOM_NAV_IDS: StaffSection[] = ['overview', 'jobs', 'clients', 'guards', 'team'];

/**
 * Staff entry point into the three surface applications.
 *
 * Mobile keeps the original drawer sidebar + bottom footer nav. Tablet and
 * desktop use their own independent shells so they never share the phone layout.
 */
export function DesktopStaffAdminShell({
  children,
  currentUser,
  activeSection,
  onNavigate,
  onSignOut,
  isDbConnected,
  navItems,
  screenTitle,
  navHighlight,
  showFinance,
  showPayments,
  showSettings,
  showPermissions,
  showDisputes,
  showCities,
  financeDeskOnly = false,
  onOpenLegal,
  onOpenDownload,
  hideHeader = false,
  themeMode,
  onChangeTheme,
  accountNotifications,
  headerExtension,
  headerOverride,
  sidebarPrimaryAction,
  sidebarPrimaryActions,
}: DesktopStaffAdminShellProps) {
  const { surface } = useSurface();
  const isMobileShell = surface === 'mobile';
  const accessFlags = {
    showFinance,
    showPayments,
    showSettings,
    showPermissions,
    showDisputes,
    showCities,
    financeDeskOnly,
  };
  const isMap = isStaffOpsMapSection(activeSection);
  const bleed = isMap || isStaffMessagesHubSection(activeSection);

  const visible = (item: StaffNavItem) => isStaffNavItemVisible(item, accessFlags);

  const navGroups = useMemo(
    () =>
      MENU_GROUPS.map((group) => ({
        title: group.label,
        items: group.ids
          .map((id) => navItems.find((n) => n.id === id))
          .filter((item): item is StaffNavItem => !!item && visible(item))
          .map((item) => ({
            id: item.id,
            label: item.label,
            icon: item.icon,
            badge: item.badge,
          })),
      })).filter((group) => group.items.length > 0),
    [
      navItems,
      showFinance,
      showPayments,
      showSettings,
      showPermissions,
      showDisputes,
      showCities,
      financeDeskOnly,
    ],
  );

  const flatNavItems = useMemo(() => navGroups.flatMap((group) => group.items), [navGroups]);

  const mobileBottomNavItems = useMemo(() => {
    if (!isMobileShell) return undefined;
    const bottomIds = financeDeskOnly
      ? (['overview', 'payments', 'payment-settings', 'agreements', 'audit-log'] as StaffSection[])
      : STAFF_BOTTOM_NAV_IDS;
    return bottomIds.map((id) => {
      const item = flatNavItems.find((nav) => nav.id === id);
      if (!item) return null;
      return {
        ...item,
        label: id === 'guards' ? 'Guard' : item.label,
      };
    }).filter((item): item is NonNullable<typeof item> => item != null);
  }, [isMobileShell, flatNavItems, financeDeskOnly]);

  const destinations = useMemo<SurfaceDestination[]>(() => {
    return MENU_GROUPS.flatMap((group) =>
      group.ids
        .map((id) => navItems.find((nav) => nav.id === id))
        .filter((item): item is StaffNavItem => Boolean(item) && visible(item!))
        .map<SurfaceDestination>((item) => {
          const mobileIndex = MOBILE_TAB_ORDER.indexOf(item.id);
          return {
            id: item.id,
            label: item.label,
            icon: item.icon,
            badge: item.badge,
            section: group.label ?? 'Operations',
            mobileRank: mobileIndex >= 0 ? mobileIndex + 1 : undefined,
            tabletQuick: TABLET_QUICK.includes(item.id),
            keywords: [group.label ?? '', item.id],
          };
        }),
    );
  }, [
    navItems,
    showFinance,
    showPayments,
    showSettings,
    showPermissions,
    showDisputes,
    showCities,
    financeDeskOnly,
  ]);

  const handleNav = (id: string) => {
    const section = id as StaffSection;
    const notice = getStaffNavAccessNotice(section, accessFlags);
    if (notice) {
      void showAppAlert({ title: notice.title, message: notice.message, tone: 'warning' });
      return;
    }
    onNavigate(section);
  };

  const accountMenu = (
    <AccountMenu
      userName={currentUser.name}
      userSubtitle={ROLE_LABELS[currentUser.role]}
      avatarUrl={currentUser.avatar}
      onOpenProfile={() => onNavigate('profile')}
      onOpenSettings={() => onNavigate('preferences')}
      onOpenDownload={onOpenDownload}
      onSignOut={onSignOut}
      active={activeSection === 'profile' || activeSection === 'preferences'}
      themeMode={themeMode}
      onChangeTheme={onChangeTheme}
      triggerVariant={surface === 'desktop' ? 'uber-direct' : 'default'}
      {...accountNotifications}
    />
  );

  const sidebarFooter = (
    <SidebarFooterLinks onOpenSettings={() => onNavigate('preferences')} onOpenLegal={onOpenLegal} />
  );

  if (isMobileShell) {
    return (
      <GuardrDrawerShell
        forceLayout="mobile"
        workspaceLabel="Staff workspace"
        title={screenTitle}
        navGroups={navGroups}
        activeNavId={navHighlight}
        onNavigate={handleNav}
        accountMenu={accountMenu}
        sidebarPrimaryAction={sidebarPrimaryAction}
        sidebarPrimaryActions={sidebarPrimaryActions}
        sidebarBrandExtra={
          isDbConnected ? (
            <Block
              width="8px"
              height="8px"
              backgroundColor="positive"
              overrides={{ Block: { style: { borderRadius: '50%', flexShrink: 0 } } }}
              aria-label="Connected"
            />
          ) : null
        }
        sidebarFooter={sidebarFooter}
        sidebarIdentity={
          <MobileDrawerIdentity
            userName={currentUser.name}
            avatarUrl={currentUser.avatar}
            onClick={() => onNavigate('profile')}
          />
        }
        hideHeader={hideHeader}
        headerExtension={headerExtension}
        headerOverride={headerOverride}
        bleed={bleed}
        variant={isMap ? 'dark' : 'default'}
        ariaLabel="Staff navigation"
        mobileBottomNavItems={mobileBottomNavItems}
      >
        {children}
      </GuardrDrawerShell>
    );
  }

  return (
    <SurfaceAppShell
      title={screenTitle}
      workspaceLabel="Staff operations"
      destinations={destinations}
      activeId={navHighlight}
      onNavigate={handleNav}
      accountMenu={accountMenu}
      navFooter={sidebarFooter}
      primaryAction={sidebarPrimaryAction ?? sidebarPrimaryActions?.[0]}
      headerExtension={headerExtension}
      headerOverride={headerOverride}
      hideChrome={hideHeader}
      bleed={bleed}
      commands={[
        {
          id: 'staff-db-status',
          label: isDbConnected ? 'Database: connected' : 'Database: offline',
          group: 'Status',
          kind: 'action',
          run: () => {
            void showAppAlert({
              title: isDbConnected ? 'Database connected' : 'Database offline',
              message: isDbConnected
                ? 'Live Supabase connection is healthy.'
                : 'Running on cached data. Changes queue locally until the connection returns.',
              tone: isDbConnected ? 'default' : 'warning',
            });
          },
        },
      ]}
    >
      {children}
    </SurfaceAppShell>
  );
}
