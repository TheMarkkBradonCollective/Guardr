import React, { useMemo } from 'react';
import { SessionUser } from '../../types';
import { canAccessFinancialControls, canAccessStaffSettings, canHandleDisputes, canViewCityMarkets, ROLE_LABELS } from '../../lib/permissions';
import { isStaffOpsMapSection, isStaffMessagesSection, StaffSection } from '../../lib/staffOps';
import { getStaffNavAccessNotice, isStaffNavItemVisible } from '../../lib/staffNavAccess';
import { StaffNavItem } from './StaffSidebarNav';
import type { LegalPageId } from '../../lib/legalContent';
import { AppScreenHeader } from '../layouts/AppScreenHeader';
import { AppHeaderBranding } from '../layouts/AppHeaderBranding';
import { AppHeaderToolbar } from '../layouts/AppHeaderToolbar';
import { NavMenuPopover } from '../layouts/NavMenuPopover';
import { AccountMenu } from '../layouts/AccountMenu';
import { showAppAlert } from '../ui/AppConfirm';
import { useDevice } from '../../lib/platform';
import { DesktopStaffAdminShell } from '../layouts/desktop/DesktopStaffAdminShell';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Building2,
  Briefcase,
  ClipboardList,
  CreditCard,
  FileText,
  DollarSign,
  LayoutDashboard,
  Map,
  MessagesSquare,
  Scale,
  Settings,
  ScrollText,
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
  UsersRound,
  MapPinned,
} from 'lucide-react';

import type { ThemeMode } from '../../lib/platform/theme';

interface StaffOpsLayoutProps {
  children: React.ReactNode;
  currentUser: SessionUser;
  activeSection: StaffSection;
  onNavigate: (section: StaffSection) => void;
  themeMode: ThemeMode;
  onChangeTheme: (mode: ThemeMode) => void;
  onSignOut: () => void;
  isDbConnected: boolean;
  badges?: Partial<Record<StaffSection, number>>;
  fullBleed?: boolean;
  onOpenLegal?: (page: LegalPageId) => void;
  hideHeader?: boolean;
  headerActions?: React.ReactNode;
  headerExtension?: React.ReactNode;
  headerOverride?: React.ReactNode;
}

const SECTION_TITLES: Record<StaffSection, string> = {
  overview: 'Overview',
  applications: 'Applications',
  credentials: 'Credentials',
  jobs: 'Jobs',
  map: 'Operations map',
  guards: 'Field guards',
  team: 'Staff',
  crews: 'Crews',
  clients: 'Clients',
  incidents: 'Client incidents',
  messages: 'Messages',
  support: 'Messages',
  'team-chat': 'Messages',
  'job-chats': 'Messages',
  payments: 'Payments',
  'payment-settings': 'Payment settings',
  agreements: 'Agreements',
  'audit-log': 'Audit log',
  disputes: 'Disputes',
  analytics: 'Analytics',
  settings: 'System Settings',
  cities: 'Operations',
  guide: 'Guide',
  'dev-updates': 'Dev notes',
  profile: 'Profile',
  preferences: 'Settings',
};

export function StaffOpsLayout({
  children,
  currentUser,
  activeSection,
  onNavigate,
  themeMode,
  onChangeTheme,
  onSignOut,
  isDbConnected,
  badges = {},
  fullBleed = false,
  onOpenLegal,
  hideHeader = false,
  headerActions,
  headerExtension,
  headerOverride,
}: StaffOpsLayoutProps) {
  const { formFactor } = useDevice();
  const showFinance = canAccessFinancialControls(currentUser);
  const showSettings = canAccessStaffSettings(currentUser);
  const showDisputes = canHandleDisputes(currentUser);
  const showCities = canViewCityMarkets(currentUser);
  const bleed =
    fullBleed ||
    isStaffOpsMapSection(activeSection) ||
    isStaffMessagesSection(activeSection);

  const navItems: StaffNavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'jobs', label: 'Jobs', icon: Briefcase, badge: badges.jobs },
    { id: 'applications', label: 'Applications', icon: UserCheck, badge: badges.applications },
    { id: 'credentials', label: 'Credentials', icon: ShieldCheck, badge: badges.credentials },
    { id: 'clients', label: 'Clients', icon: Building2, badge: badges.clients },
    { id: 'guards', label: 'Guards', icon: Shield, badge: badges.guards },
    { id: 'crews', label: 'Crews', icon: UsersRound, badge: badges.crews },
    { id: 'team', label: 'Staff', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessagesSquare, badge: badges.messages },
    { id: 'payments', label: 'Payments', icon: DollarSign, badge: badges.payments, financeOnly: true },
    { id: 'payment-settings', label: 'Payment settings', icon: CreditCard, financeOnly: true },
    { id: 'agreements', label: 'Agreements', icon: FileText, financeOnly: true },
    { id: 'audit-log', label: 'Audit log', icon: ScrollText, financeOnly: true },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle, badge: badges.incidents },
    { id: 'disputes', label: 'Disputes', icon: Scale, badge: badges.disputes, disputesOnly: true },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'guide', label: 'Guide', icon: BookOpen },
    { id: 'dev-updates', label: 'Dev notes', icon: ClipboardList, financeOnly: true },
    { id: 'cities', label: 'Operations', icon: MapPinned, citiesOnly: true },
    { id: 'settings', label: 'Settings', icon: Settings, settingsOnly: true },
  ];

  const accessFlags = { showFinance, showSettings, showDisputes, showCities };
  const navHighlight = isStaffMessagesSection(activeSection) ? 'messages' : activeSection;
  const screenTitle = SECTION_TITLES[navHighlight];

  const accountMenu = {
    userName: currentUser.name,
    userSubtitle: ROLE_LABELS[currentUser.role],
    avatarUrl: currentUser.avatar,
    onOpenProfile: () => onNavigate('profile'),
    onOpenSettings: () => onNavigate('preferences'),
    onSignOut,
    active: activeSection === 'profile' || activeSection === 'preferences',
  };

  const popoverItems = useMemo(
    () =>
      navItems
        .filter((item) => isStaffNavItemVisible(item, accessFlags))
        .map((item) => ({
          id: item.id,
          label: item.label,
          icon: item.icon,
          badge: item.badge,
        })),
    [navItems, accessFlags],
  );

  const handlePopoverNavigate = (id: string) => {
    const section = id as StaffSection;
    const notice = getStaffNavAccessNotice(section, accessFlags);
    if (notice) {
      void showAppAlert({ title: notice.title, message: notice.message, tone: 'warning' });
      return;
    }
    onNavigate(section);
  };

  const navMenu = (
    <NavMenuPopover items={popoverItems} activeId={navHighlight} onNavigate={handlePopoverNavigate} />
  );

  const brandingTrailing = isDbConnected ? (
    <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse shrink-0" aria-label="Connected" />
  ) : null;

  if (formFactor === 'desktop') {
    return (
      <DesktopStaffAdminShell
        currentUser={currentUser}
        activeSection={activeSection}
        onNavigate={onNavigate}
        onSignOut={onSignOut}
        isDbConnected={isDbConnected}
        navItems={navItems}
        screenTitle={screenTitle}
        navHighlight={navHighlight}
        showFinance={showFinance}
        showSettings={showSettings}
        showDisputes={showDisputes}
        showCities={showCities}
        onOpenLegal={onOpenLegal}
        hideHeader={hideHeader}
        headerActions={headerActions}
        headerExtension={headerExtension}
        headerOverride={headerOverride}
      >
        {children}
      </DesktopStaffAdminShell>
    );
  }

  return (
    <div className="staff-shell staff-shell--compact page-shell fixed inset-0 flex h-dvh max-h-dvh overflow-hidden bg-brand-bg text-brand-text">
      <div className="staff-main flex-1 flex flex-col min-w-0 min-h-0 w-full">
        {headerOverride ? (
          <header className="staff-main-header-slot shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))] border-b border-brand-border bg-brand-surface">
            {headerOverride}
          </header>
        ) : hideHeader ? (
          <header className="staff-main-header staff-main-header-compact app-screen-header shrink-0 border-b border-brand-border">
            <div className="app-screen-header-brand-row">
              <AppHeaderBranding trailing={brandingTrailing} logoSize={18} />
            </div>
            <AppHeaderToolbar
              showTitle={false}
              left={navMenu}
              right={
                <>
                  {headerActions}
                  <AccountMenu {...accountMenu} />
                </>
              }
            />
          </header>
        ) : (
          <AppScreenHeader
            title={screenTitle}
            accountMenu={accountMenu}
            notifications={headerActions}
            navMenu={navMenu}
            extension={headerExtension}
            brandingTrailing={brandingTrailing}
          />
        )}

        <main
          className={`staff-main-content flex-1 min-h-0 min-w-0 overflow-hidden ${
            bleed ? 'staff-main-content--bleed' : 'staff-main-content--padded'
          }`}
        >
          <div className={`h-full max-w-full min-w-0 ${bleed ? 'overflow-hidden' : 'overflow-x-hidden overflow-y-auto overscroll-contain'}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export type { StaffSection };
