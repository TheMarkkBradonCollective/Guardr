import React, { useMemo } from 'react';
import { SessionUser } from '../../../types';
import { ROLE_LABELS } from '../../../lib/permissions';
import { isStaffOpsMapSection, isStaffMessagesHubSection, StaffSection } from '../../../lib/staffOps';
import { getStaffNavAccessNotice, isStaffNavItemVisible } from '../../../lib/staffNavAccess';
import type { LegalPageId } from '../../../lib/legalContent';
import type { ThemeMode } from '../../../lib/platform/theme';
import { AccountMenu, type AccountMenuNotificationProps } from '../AccountMenu';
import { SidebarFooterLinks } from '../SidebarFooterLinks';
import { STAFF_NAV_GROUPS } from '../../../lib/staffNavGroups';
import { StaffNavItem } from '../../staff/StaffSidebarNav';
import { showAppAlert } from '../../ui/AppConfirm';
import type { SidebarPrimaryAction } from '../../baseui/layout/GuardrDrawerShell';
import type { SurfacePrimaryAction } from '../../../surfaces/surfaceShellTypes';
import { useSurface } from '../../../surfaces/SurfaceProvider';
import { SurfaceAppShell } from '../../../surfaces/SurfaceAppShell';
import type { SurfaceDestination } from '../../../surfaces/surfaceNavigation';
import { ProfileAvatar } from '../../profile/ProfileAvatar';

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

/** Section groups for rail / sidebar / More sheet — see staffNavGroups.ts */
const MENU_GROUPS = STAFF_NAV_GROUPS;

/** Thumb-order tabs for the mobile staff app. Everything else lives in More. */
const MOBILE_TAB_ORDER: StaffSection[] = ['overview', 'jobs', 'guards', 'messages'];
const FINANCE_TAB_ORDER: StaffSection[] = [
  'overview',
  'payments',
  'platform-fees',
  'staff-compensation',
  'agreements',
];

/** Destinations pinned to the tablet quick-switch row — live ops, not admin. */
const TABLET_QUICK: StaffSection[] = ['overview', 'map', 'jobs'];

/**
 * Staff entry point into the three surface applications.
 *
 * Mobile, tablet, and desktop each load their own independent shell. Destinations
 * are the same catalog; only the arrangement changes.
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

  const destinations = useMemo<SurfaceDestination[]>(() => {
    const mobileOrder = financeDeskOnly ? FINANCE_TAB_ORDER : MOBILE_TAB_ORDER;
    return MENU_GROUPS.flatMap((group) =>
      group.ids
        .map((id) => navItems.find((nav) => nav.id === id))
        .filter((item): item is StaffNavItem => Boolean(item) && visible(item!))
        .map<SurfaceDestination>((item) => {
          const mobileIndex = mobileOrder.indexOf(item.id);
          return {
            id: item.id,
            label: item.label,
            icon: item.icon,
            section: group.title ?? 'Operations',
            mobileRank: mobileIndex >= 0 ? mobileIndex + 1 : undefined,
            tabletQuick: TABLET_QUICK.includes(item.id),
            keywords: [group.title ?? '', item.id],
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

  return (
    <SurfaceAppShell
      title={screenTitle}
      workspaceLabel="Staff operations"
      destinations={destinations}
      activeId={navHighlight}
      onNavigate={handleNav}
      notifications={undefined}
      identity={
        <ProfileAvatar
          src={currentUser.avatar}
          name={currentUser.name}
          size="sm"
          className="sfm-shell-avatar"
        />
      }
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
