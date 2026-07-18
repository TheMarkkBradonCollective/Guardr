import React, { useMemo } from 'react';
import { SessionUser } from '../../types';
import { canAccessFinancialControls, canAccessStaffPermissions, canHandleDisputes, canViewCityMarkets } from '../../lib/permissions';
import { isStaffMessagesSection, StaffSection } from '../../lib/staffOps';
import { StaffNavItem } from './StaffSidebarNav';
import type { LegalPageId } from '../../lib/legalContent';
import type { ThemeMode } from '../../lib/platform/theme';
import { DesktopStaffAdminShell } from '../layouts/desktop/DesktopStaffAdminShell';
import { StaffShellCreateProvider, useStaffSidebarPrimaryActions } from './StaffShellCreateContext';
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
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  UsersRound,
  MapPinned,
  Plug,
  KeyRound,
} from 'lucide-react';

import type { AccountMenuNotificationProps } from '../layouts/AccountMenu';

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
  accountNotifications?: AccountMenuNotificationProps;
  headerExtension?: React.ReactNode;
  headerOverride?: React.ReactNode;
  canCreateJob?: boolean;
  canAddClient?: boolean;
  canAddGuard?: boolean;
  canAddStaff?: boolean;
  canAddCredential?: boolean;
  canCreateCrew?: boolean;
}

const SECTION_TITLES: Record<StaffSection, string> = {
  overview: 'Overview',
  applications: 'Applications',
  credentials: 'Credentials',
  jobs: 'Jobs',
  map: 'Map',
  guards: 'Guards',
  team: 'Staff',
  crews: 'Crews',
  clients: 'Clients',
  incidents: 'Incidents',
  messages: 'Messages',
  support: 'Messages',
  'team-chat': 'Messages',
  'job-chats': 'Messages',
  payments: 'Payments',
  'payment-settings': 'Payment settings',
  agreements: 'Agreements',
  'audit-log': 'Audit log',
  disputes: 'Disputes',
  violations: 'Violations',
  stats: 'Stats',
  analytics: 'Analytics',
  settings: 'Public Information',
  permissions: 'Permissions',
  integrations: 'Integrations',
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
  themeMode: _themeMode,
  onChangeTheme: _onChangeTheme,
  onSignOut,
  isDbConnected,
  badges = {},
  fullBleed: _fullBleed = false,
  onOpenLegal,
  hideHeader = false,
  accountNotifications,
  headerExtension,
  headerOverride,
  canCreateJob = false,
  canAddClient = false,
  canAddGuard = false,
  canAddStaff = false,
  canAddCredential = false,
  canCreateCrew = false,
}: StaffOpsLayoutProps) {
  const showFinance = canAccessFinancialControls(currentUser);
  const showPermissions = canAccessStaffPermissions(currentUser);
  const showDisputes = canHandleDisputes(currentUser);
  const showCities = canViewCityMarkets(currentUser);

  const navItems: StaffNavItem[] = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      { id: 'map', label: 'Map', icon: Map },
      { id: 'jobs', label: 'Jobs', icon: Briefcase, badge: badges.jobs },
      { id: 'applications', label: 'Applications', icon: UserCheck, badge: badges.applications },
      { id: 'credentials', label: 'Credentials', icon: ShieldCheck, badge: badges.credentials },
      { id: 'guards', label: 'Guards', icon: Shield, badge: badges.guards },
      { id: 'crews', label: 'Crews', icon: UsersRound, badge: badges.crews },
      { id: 'clients', label: 'Clients', icon: Building2, badge: badges.clients },
      { id: 'team', label: 'Staff', icon: Users },
      { id: 'messages', label: 'Messages', icon: MessagesSquare, badge: badges.messages },
      { id: 'payments', label: 'Payments', icon: DollarSign, badge: badges.payments, financeOnly: true },
      { id: 'payment-settings', label: 'Payment settings', icon: CreditCard, financeOnly: true },
      { id: 'agreements', label: 'Agreements', icon: FileText, financeOnly: true },
      { id: 'audit-log', label: 'Audit log', icon: ScrollText, financeOnly: true },
      { id: 'incidents', label: 'Incidents', icon: AlertTriangle, badge: badges.incidents },
      { id: 'violations', label: 'Violations', icon: ShieldAlert, badge: badges.violations },
      { id: 'stats', label: 'Stats', icon: BarChart3 },
      { id: 'disputes', label: 'Disputes', icon: Scale, badge: badges.disputes, disputesOnly: true },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'cities', label: 'Operations', icon: MapPinned, citiesOnly: true },
      { id: 'permissions', label: 'Permissions', icon: KeyRound, permissionsOnly: true },
      { id: 'settings', label: 'Public Information', icon: Settings },
      { id: 'integrations', label: 'Integrations', icon: Plug },
      { id: 'guide', label: 'Guide', icon: BookOpen },
      { id: 'dev-updates', label: 'Dev notes', icon: ClipboardList, financeOnly: true },
    ],
    [badges],
  );

  const navHighlight = isStaffMessagesSection(activeSection) ? 'messages' : activeSection;
  const screenTitle = SECTION_TITLES[navHighlight];

  return (
    <StaffShellCreateProvider>
      <StaffOpsLayoutInner
        currentUser={currentUser}
        activeSection={activeSection}
        onNavigate={onNavigate}
        onSignOut={onSignOut}
        isDbConnected={isDbConnected}
        navItems={navItems}
        screenTitle={screenTitle}
        navHighlight={navHighlight}
        showFinance={showFinance}
        showSettings={true}
        showPermissions={showPermissions}
        showDisputes={showDisputes}
        showCities={showCities}
        onOpenLegal={onOpenLegal}
        hideHeader={hideHeader}
        accountNotifications={accountNotifications}
        headerExtension={headerExtension}
        headerOverride={headerOverride}
        canCreateJob={canCreateJob}
        canAddClient={canAddClient}
        canAddGuard={canAddGuard}
        canAddStaff={canAddStaff}
        canAddCredential={canAddCredential}
        canCreateCrew={canCreateCrew}
      >
        {children}
      </StaffOpsLayoutInner>
    </StaffShellCreateProvider>
  );
}

interface StaffOpsLayoutInnerProps
  extends Omit<StaffOpsLayoutProps, 'themeMode' | 'onChangeTheme' | 'fullBleed' | 'badges'> {
  navItems: StaffNavItem[];
  screenTitle: string;
  navHighlight: StaffSection;
  showFinance: boolean;
  showSettings: boolean;
  showPermissions: boolean;
  showDisputes: boolean;
  showCities: boolean;
}

function StaffOpsLayoutInner({
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
  canCreateJob = false,
  canAddClient = false,
  canAddGuard = false,
  canAddStaff = false,
  canAddCredential = false,
  canCreateCrew = false,
}: StaffOpsLayoutInnerProps) {
  const sidebarPrimaryActions = useStaffSidebarPrimaryActions(navHighlight, {
    canCreateJob: navHighlight === 'jobs' && canCreateJob,
    canAddClient: (navHighlight === 'clients' || navHighlight === 'applications') && canAddClient,
    canAddGuard: (navHighlight === 'guards' || navHighlight === 'applications') && canAddGuard,
    canAddStaff: navHighlight === 'team' && canAddStaff,
    canAddCredential: navHighlight === 'credentials' && canAddCredential,
    canCreateCrew: navHighlight === 'crews' && canCreateCrew,
  });

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
      showPermissions={showPermissions}
      showDisputes={showDisputes}
      showCities={showCities}
      onOpenLegal={onOpenLegal}
      hideHeader={hideHeader}
      accountNotifications={accountNotifications}
      headerExtension={headerExtension}
      headerOverride={headerOverride}
      sidebarPrimaryActions={sidebarPrimaryActions}
    >
      {children}
    </DesktopStaffAdminShell>
  );
}

export type { StaffSection };
