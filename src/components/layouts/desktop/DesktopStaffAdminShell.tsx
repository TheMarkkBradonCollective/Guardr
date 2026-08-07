import React, { useMemo } from 'react';
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
import type { SidebarPrimaryAction } from '../../baseui/layout/GuardrDrawerShell';
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
  onOpenLegal?: (page: LegalPageId) => void;
  onOpenDownload?: () => void;
  hideHeader?: boolean;
  themeMode?: ThemeMode;
  onChangeTheme?: (mode: ThemeMode) => void;
  accountNotifications?: AccountMenuNotificationProps;
  headerExtension?: React.ReactNode;
  headerOverride?: React.ReactNode;
  sidebarPrimaryAction?: SidebarPrimaryAction;
  sidebarPrimaryActions?: SidebarPrimaryAction[];
}

/** Section groups. Mobile collapses these into its More sheet; tablet and desktop show them expanded. */
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

/** Thumb-order tabs for the mobile staff app. Everything else lives in the More sheet. */
const MOBILE_TAB_ORDER: StaffSection[] = ['overview', 'jobs', 'guards', 'messages'];

/** Destinations pinned to the tablet quick-switch row — live ops, not admin. */
const TABLET_QUICK: StaffSection[] = ['overview', 'map', 'jobs'];

/**
 * Staff entry point into the three surface applications.
 *
 * Staff have the widest destination list in the product (28 sections), which is
 * exactly why the three surfaces cannot share a layout: the desktop operations
 * centre shows all of them in a grouped sidebar with a command palette, the
 * tablet shows them on a scrollable labelled rail, and the mobile app shows four
 * tabs with the rest behind a sheet.
 *
 * The file name is historical — it now dispatches to all three surfaces rather
 * than only the desktop one.
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
  const accessFlags = { showFinance, showPayments, showSettings, showPermissions, showDisputes, showCities };
  const isMap = isStaffOpsMapSection(activeSection);
  const bleed = isMap || isStaffMessagesHubSection(activeSection);

  const destinations = useMemo<SurfaceDestination[]>(() => {
    const visible = (item: StaffNavItem) => isStaffNavItemVisible(item, accessFlags);

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

  return (
    <SurfaceAppShell
      title={screenTitle}
      workspaceLabel="Staff operations"
      destinations={destinations}
      activeId={navHighlight}
      onNavigate={handleNav}
      accountMenu={accountMenu}
      identity={
        surface === 'mobile' ? (
          <MobileDrawerIdentity
            userName={currentUser.name}
            avatarUrl={currentUser.avatar}
            onClick={() => onNavigate('profile')}
          />
        ) : undefined
      }
      navFooter={
        <SidebarFooterLinks onOpenSettings={() => onNavigate('preferences')} onOpenLegal={onOpenLegal} />
      }
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
