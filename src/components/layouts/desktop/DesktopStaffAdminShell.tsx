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
import { AppInstallBanner } from '../../apps/AppInstallBanner';

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
  showManagement: boolean;
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
  workspaceLabel?: string;
}

/** Section groups for rail / sidebar / More sheet — see staffNavGroups.ts */
const MENU_GROUPS = STAFF_NAV_GROUPS;

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
  showManagement,
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
  workspaceLabel = 'Staff',
}: DesktopStaffAdminShellProps) {
  const { surface } = useSurface();
  const accessFlags = {
    showFinance,
    showPayments,
    showSettings,
    showPermissions,
    showDisputes,
    showCities,
    showManagement,
    financeDeskOnly,
  };
  const isMap = isStaffOpsMapSection(activeSection);
  const bleed = isMap || isStaffMessagesHubSection(activeSection);

  const visible = (item: StaffNavItem) => isStaffNavItemVisible(item, accessFlags);

  const destinations = useMemo<SurfaceDestination[]>(() => {
    return MENU_GROUPS.flatMap((group) =>
      group.ids
        .map((id) => navItems.find((nav) => nav.id === id))
        .filter((item): item is StaffNavItem => Boolean(item) && visible(item!))
        .map<SurfaceDestination>((item) => ({
          id: item.id,
          label: item.label,
          icon: item.icon,
          section: group.title ?? 'Operations',
          tabletQuick: TABLET_QUICK.includes(item.id) || (navItems.length <= 2 && (item.id === 'messages' || item.id === 'support')),
          keywords: [group.title ?? '', item.id],
        })),
    );
  }, [
    navItems,
    showFinance,
    showPayments,
    showSettings,
    showPermissions,
    showDisputes,
    showCities,
    showManagement,
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
      workspaceLabel={workspaceLabel}
      destinations={destinations}
      activeId={navHighlight}
      onNavigate={handleNav}
      mobilePrimaryNav="drawer"
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
      <AppInstallBanner productApp="staff" />
      {children}
    </SurfaceAppShell>
  );
}
