import React, { useEffect, useState } from 'react';
import { SessionUser } from '../../types';
import { canAccessFinancialControls, canAccessStaffSettings, canHandleDisputes, ROLE_LABELS } from '../../lib/permissions';
import { isStaffOpsMapSection, isStaffMessagesSection, StaffSection } from '../../lib/staffOps';
import { StaffSidebarNav, StaffNavItem } from './StaffSidebarNav';
import { LegalFooterLinks } from '../legal/LegalFooterLinks';
import type { LegalPageId } from '../../lib/legalContent';
import { AccountMenu } from '../layouts/AccountMenu';
import { Logo } from '../Logo';
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
  Menu,
  MessagesSquare,
  Scale,
  Settings,
  ScrollText,
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
  UsersRound,
  X,
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
  crews: 'Teams',
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const dockedSidebar = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);

  useEffect(() => {
    if (!mobileNavOpen || dockedSidebar) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileNavOpen, dockedSidebar]);
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
    { id: 'crews', label: 'Teams', icon: UsersRound, badge: badges.crews },
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

  const navigate = (section: StaffSection) => {
    onNavigate(section);
    setMobileNavOpen(false);
  };

  const isDarkSidebar = themeMode === 'dark' || themeMode === 'grey';

  const sidebarPanel = (
    <>
      <button
        type="button"
        className="staff-sidebar-close"
        onClick={() => setMobileNavOpen(false)}
        aria-label="Close menu"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="staff-sidebar-inner">
        <div className="staff-sidebar-brand">
          <div className="flex items-center gap-2.5">
            <Logo size={24} className="shrink-0" />
            <span
              className={`font-black text-xl tracking-[-0.04em] leading-none staff-sidebar-wordmark${
                isDarkSidebar ? ' staff-sidebar-wordmark--on-dark' : ''
              }`}
            >
              Guardr
            </span>
            {isDbConnected && (
              <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse shrink-0" aria-label="Connected" />
            )}
          </div>
          <p
            className={`text-[11px] font-semibold tracking-[0.04em] uppercase mt-1.5 staff-sidebar-role${
              isDarkSidebar ? ' staff-sidebar-role--on-dark' : ''
            }`}
          >
            {ROLE_LABELS[currentUser.role]}
          </p>
        </div>
        <div className="staff-sidebar-nav flex-1 min-h-0 overflow-y-auto overscroll-contain">
          <StaffSidebarNav
            items={navItems}
            activeSection={isStaffMessagesSection(activeSection) ? 'messages' : activeSection}
            onNavigate={navigate}
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
    </>
  );

  return (
    <div
      className={`staff-shell page-shell fixed inset-0 flex h-dvh max-h-dvh overflow-hidden bg-brand-bg text-brand-text ${
        dockedSidebar ? 'staff-shell--desktop' : 'staff-shell--compact'
      }${mobileNavOpen && !dockedSidebar ? ' staff-shell--nav-open' : ''}`}
    >
      {dockedSidebar ? (
        <aside className={`staff-sidebar staff-sidebar-${themeMode} staff-sidebar--docked`}>{sidebarPanel}</aside>
      ) : (
        mobileNavOpen && (
          <>
            <button
              type="button"
              className="staff-sidebar-backdrop"
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation"
            />
            <aside
              className={`staff-sidebar staff-sidebar-${themeMode} staff-sidebar--overlay staff-sidebar-open`}
              role="dialog"
              aria-modal="true"
              aria-label="Staff navigation"
            >
              {sidebarPanel}
            </aside>
          </>
        )
      )}

      <div className="staff-main flex-1 flex flex-col min-w-0 min-h-0 w-full">
        {headerOverride ? (
          <header className="staff-main-header-slot shrink-0 pt-[max(0.75rem,env(safe-area-inset-top))] border-b border-brand-border bg-brand-surface">
            {headerOverride}
          </header>
        ) : hideHeader ? (
          <header className="staff-main-header staff-main-header-compact shrink-0 flex items-center justify-between gap-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2.5 border-b border-brand-border">
            <button
              type="button"
              className={`app-chrome-btn -ml-1 text-brand-text${dockedSidebar ? ' hidden' : ''}`}
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 shrink-0">
              {headerActions}
              <AccountMenu
                userName={currentUser.name}
                userSubtitle={ROLE_LABELS[currentUser.role]}
                avatarUrl={currentUser.avatar}
                onOpenProfile={() => navigate('profile')}
                onOpenSettings={() => navigate('preferences')}
                onSignOut={onSignOut}
                active={activeSection === 'profile' || activeSection === 'preferences'}
              />
            </div>
          </header>
        ) : (
          <header
            className={`staff-main-header shrink-0 border-b border-brand-border${
              headerExtension ? ' staff-main-header--with-extension' : ''
            }`}
          >
            <div className="flex items-center gap-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 px-4 sm:px-5">
              <button
                type="button"
                className={`app-chrome-btn -ml-1 text-brand-text${dockedSidebar ? ' hidden' : ''}`}
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-black tracking-[-0.03em] leading-tight truncate">
                  {SECTION_TITLES[isStaffMessagesSection(activeSection) ? 'messages' : activeSection]}
                </h1>
                <p className="text-xs text-brand-text-muted truncate font-medium mt-0.5">{currentUser.name}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {headerActions}
                <AccountMenu
                  userName={currentUser.name}
                  userSubtitle={ROLE_LABELS[currentUser.role]}
                  avatarUrl={currentUser.avatar}
                  onOpenProfile={() => navigate('profile')}
                  onOpenSettings={() => navigate('preferences')}
                  onSignOut={onSignOut}
                  active={activeSection === 'profile' || activeSection === 'preferences'}
                />
              </div>
            </div>
            {headerExtension ? (
              <div className="staff-main-header-extension">{headerExtension}</div>
            ) : null}
          </header>
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
