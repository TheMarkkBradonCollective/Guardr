import React, { useMemo } from 'react';
import { SessionUser } from '../../types';
import { canAccessFinancialControls, canAccessStaffSettings, canHandleDisputes, ROLE_LABELS } from '../../lib/permissions';
import { isStaffOpsMapSection, isStaffMessagesSection, StaffSection } from '../../lib/staffOps';
import { getStaffNavAccessNotice } from '../../lib/staffNavAccess';
import { StaffSidebarNav, StaffNavItem } from './StaffSidebarNav';
import { LegalFooterLinks } from '../legal/LegalFooterLinks';
import type { LegalPageId } from '../../lib/legalContent';
import { AppScreenHeader } from '../layouts/AppScreenHeader';
import { AppHeaderBranding } from '../layouts/AppHeaderBranding';
import { AppHeaderToolbar } from '../layouts/AppHeaderToolbar';
import { NavMenuPopover } from '../layouts/NavMenuPopover';
import { AccountMenu } from '../layouts/AccountMenu';
import { showAppAlert } from '../ui/AppConfirm';
import { BREAKPOINTS, useMediaQuery } from '../../lib/platform';
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
} from 'lucide-react';

type ThemeMode = 'dark' | 'light' | 'grey';

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
  agreements: 'Marketplace agreements',
  'audit-log': 'Audit log',
  disputes: 'Disputes',
  analytics: 'Analytics',
  settings: 'System Settings',
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
  const dockedSidebar = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
  const showFinance = canAccessFinancialControls(currentUser);
  const showSettings = canAccessStaffSettings(currentUser);
  const showDisputes = canHandleDisputes(currentUser);
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
    { id: 'agreements', label: 'Marketplace agreements', icon: FileText, financeOnly: true },
    { id: 'audit-log', label: 'Audit log', icon: ScrollText, financeOnly: true },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle, badge: badges.incidents },
    { id: 'disputes', label: 'Disputes', icon: Scale, badge: badges.disputes, disputesOnly: true },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'guide', label: 'Guide', icon: BookOpen },
    { id: 'dev-updates', label: 'Dev notes', icon: ClipboardList, financeOnly: true },
    { id: 'settings', label: 'Settings', icon: Settings, settingsOnly: true },
  ];

  const accessFlags = { showFinance, showSettings, showDisputes };
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
      navItems.map((item) => ({
        id: item.id,
        label: item.label,
        icon: item.icon,
        badge: item.badge,
      })),
    [navItems],
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

  const navMenu = !dockedSidebar ? (
    <NavMenuPopover items={popoverItems} activeId={navHighlight} onNavigate={handlePopoverNavigate} />
  ) : null;

  const brandingTrailing = isDbConnected ? (
    <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse shrink-0" aria-label="Connected" />
  ) : null;

  const sidebarPanel = (
    <div className="staff-sidebar-inner">
      <div className="staff-sidebar-nav flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <StaffSidebarNav
          items={navItems}
          activeSection={navHighlight}
          onNavigate={onNavigate}
          showFinance={showFinance}
          showSettings={showSettings}
          showDisputes={showDisputes}
        />
      </div>
      <div className="staff-sidebar-footer">
        {onOpenLegal && (
          <LegalFooterLinks onOpenLegal={onOpenLegal} className="justify-center" />
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`staff-shell page-shell fixed inset-0 flex h-dvh max-h-dvh overflow-hidden bg-brand-bg text-brand-text ${
        dockedSidebar ? 'staff-shell--desktop' : 'staff-shell--compact'
      }`}
    >
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

      {dockedSidebar ? (
        <aside className={`staff-sidebar staff-sidebar-${themeMode} staff-sidebar--docked`}>{sidebarPanel}</aside>
      ) : null}
    </div>
  );
}

export type { StaffSection };
