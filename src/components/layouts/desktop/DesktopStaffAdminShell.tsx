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
import { useDevice } from '../../../lib/platform';
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

/** Uber Direct sidebar groups — order matches staff nav list with section labels. */
const MENU_GROUPS: { label?: string; ids: StaffSection[] }[] = [
  { label: 'Dashboard', ids: ['overview', 'map'] },
  {
    label: 'Operations',
    ids: ['jobs', 'locations', 'applications', 'credentials', 'guards', 'clients', 'team'],
  },
  { label: 'Communications', ids: ['messages', 'support'] },
  { label: 'Management', ids: ['payments', 'staff-pay', 'payment-settings', 'agreements', 'audit-log'] },
  { ids: ['incidents', 'violations', 'stats', 'disputes', 'analytics'] },
  { label: 'Platform', ids: ['cities', 'permissions', 'settings', 'integrations', 'guide', 'dev-updates'] },
];

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
  const { formFactor } = useDevice();
  // Bottom nav is mobile-only — tablet uses persistent sidebar (merge shell), matching RoleAppShell.
  const isMobileShell = formFactor === 'mobile';
  const accessFlags = { showFinance, showSettings, showPermissions, showDisputes, showCities };
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
    [navItems, showFinance, showSettings, showPermissions, showDisputes, showCities],
  );

  const flatNavItems = useMemo(
    () => navGroups.flatMap((group) => group.items),
    [navGroups],
  );

  const STAFF_BOTTOM_NAV_IDS: StaffSection[] = ['overview', 'jobs', 'clients', 'guards', 'team'];

  const mobileBottomNavItems = useMemo(() => {
    if (!isMobileShell) return undefined;
    return STAFF_BOTTOM_NAV_IDS.map((id) => {
      const item = flatNavItems.find((nav) => nav.id === id);
      if (!item) return null;
      return {
        ...item,
        label: id === 'guards' ? 'Guard' : item.label,
      };
    }).filter((item): item is NonNullable<typeof item> => item != null);
  }, [isMobileShell, flatNavItems]);

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
      triggerVariant="uber-direct"
      {...accountNotifications}
    />
  );

  return (
    <GuardrDrawerShell
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
      sidebarFooter={
        <SidebarFooterLinks
          onOpenSettings={() => onNavigate('preferences')}
          onOpenLegal={onOpenLegal}
        />
      }
      sidebarIdentity={
        isMobileShell ? (
          <MobileDrawerIdentity
            userName={currentUser.name}
            avatarUrl={currentUser.avatar}
            onClick={() => onNavigate('profile')}
          />
        ) : undefined
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
