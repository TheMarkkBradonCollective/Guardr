import React, { useMemo } from 'react';
import { Block } from 'baseui/block';
import { SessionUser } from '../../../types';
import { ROLE_LABELS } from '../../../lib/permissions';
import { isStaffOpsMapSection, isStaffMessagesSection, StaffSection } from '../../../lib/staffOps';
import { getStaffNavAccessNotice, isStaffNavItemVisible } from '../../../lib/staffNavAccess';
import type { LegalPageId } from '../../../lib/legalContent';
import { AccountMenu, type AccountMenuNotificationProps } from '../AccountMenu';
import { LegalFooterLinks } from '../../legal/LegalFooterLinks';
import { StaffNavItem } from '../../staff/StaffSidebarNav';
import { showAppAlert } from '../../ui/AppConfirm';
import { GuardrDrawerShell } from '../../baseui/layout/GuardrDrawerShell';

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
  hideHeader?: boolean;
  accountNotifications?: AccountMenuNotificationProps;
  headerExtension?: React.ReactNode;
  headerOverride?: React.ReactNode;
}

const MENU_GROUPS: { label: string; ids: StaffSection[] }[] = [
  { label: 'Command', ids: ['overview', 'map'] },
  {
    label: 'Operations',
    ids: ['jobs', 'applications', 'credentials', 'guards', 'crews', 'clients', 'team', 'messages'],
  },
  { label: 'Finance', ids: ['payments', 'payment-settings', 'agreements', 'audit-log'] },
  { label: 'Support & insights', ids: ['incidents', 'violations', 'stats', 'disputes', 'analytics'] },
  { label: 'Platform', ids: ['cities', 'permissions', 'settings', 'integrations', 'guide', 'dev-updates', 'design-qa'] },
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
  hideHeader = false,
  accountNotifications,
  headerExtension,
  headerOverride,
}: DesktopStaffAdminShellProps) {
  const accessFlags = { showFinance, showSettings, showPermissions, showDisputes, showCities };
  const isMap = isStaffOpsMapSection(activeSection);
  const bleed = isMap || isStaffMessagesSection(activeSection);

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
      onSignOut={onSignOut}
      active={activeSection === 'profile' || activeSection === 'preferences'}
      {...accountNotifications}
    />
  );

  return (
    <GuardrDrawerShell
      workspaceLabel="Operations"
      title={screenTitle}
      navGroups={navGroups}
      activeNavId={navHighlight}
      onNavigate={handleNav}
      accountMenu={accountMenu}
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
        onOpenLegal ? <LegalFooterLinks onOpenLegal={onOpenLegal} className="justify-center" /> : undefined
      }
      hideHeader={hideHeader}
      headerExtension={headerExtension}
      headerOverride={headerOverride}
      bleed={bleed}
      variant={isMap ? 'dark' : 'default'}
      onSettingsClick={() => onNavigate('settings')}
      ariaLabel="Staff navigation"
    >
      {children}
    </GuardrDrawerShell>
  );
}
