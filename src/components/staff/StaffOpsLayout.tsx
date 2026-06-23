import React, { useState } from 'react';
import { SessionUser } from '../../types';
import { canAccessFinancialControls, ROLE_LABELS } from '../../lib/permissions';
import { isStaffOpsMapSection, isStaffMessagesSection, StaffSection } from '../../lib/staffOps';
import { StaffSidebarNav, StaffNavItem } from './StaffSidebarNav';
import { LegalFooterLinks } from '../legal/LegalFooterLinks';
import type { LegalPageId } from '../../lib/legalContent';
import { AccountMenu } from '../layouts/AccountMenu';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  Building2,
  Briefcase,
  ClipboardCheck,
  DollarSign,
  LayoutDashboard,
  Map,
  Menu,
  MessagesSquare,
  Scale,
  Settings,
  Shield,
  Users,
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
}

const SECTION_TITLES: Record<StaffSection, string> = {
  overview: 'Overview',
  approvals: 'Approvals',
  jobs: 'Jobs',
  map: 'Operations map',
  guards: 'Field guards',
  team: 'Staff',
  clients: 'Clients',
  incidents: 'Client incidents',
  messages: 'Messages',
  support: 'Messages',
  'team-chat': 'Messages',
  'job-chats': 'Messages',
  payments: 'Payments',
  disputes: 'Disputes',
  analytics: 'Analytics',
  settings: 'System Settings',
  guide: 'Workflow guide',
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
}: StaffOpsLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const showFinance = canAccessFinancialControls(currentUser);
  const bleed =
    fullBleed ||
    isStaffOpsMapSection(activeSection) ||
    isStaffMessagesSection(activeSection);

  const navItems: StaffNavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'jobs', label: 'Jobs', icon: Briefcase, badge: badges.jobs },
    { id: 'approvals', label: 'Approvals', icon: ClipboardCheck, badge: badges.approvals },
    { id: 'clients', label: 'Clients', icon: Building2 },
    { id: 'guards', label: 'Guards', icon: Shield },
    { id: 'team', label: 'Staff', icon: Users },
    { id: 'messages', label: 'Messages', icon: MessagesSquare, badge: badges.messages },
    { id: 'payments', label: 'Payments', icon: DollarSign, badge: badges.payments, adminOnly: true },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle, badge: badges.incidents },
    { id: 'disputes', label: 'Disputes', icon: Scale, badge: badges.disputes },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'guide', label: 'Workflow guide', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings, adminOnly: true },
  ];

  const navigate = (section: StaffSection) => {
    onNavigate(section);
    setMobileNavOpen(false);
  };

  const isDarkSidebar = themeMode === 'dark' || themeMode === 'grey';

  const sidebar = (
    <div className="staff-sidebar-inner">
      <div className="staff-sidebar-brand">
        <div className="flex items-center gap-2.5">
          <span
            className="font-black text-xl tracking-[-0.04em] leading-none"
            style={{ color: isDarkSidebar ? '#ffffff' : undefined }}
          >
            Guardr
          </span>
          {isDbConnected && (
            <span className="w-2 h-2 rounded-full bg-brand-primary animate-pulse shrink-0" aria-label="Connected" />
          )}
        </div>
        <p
          className="text-[11px] font-semibold tracking-[0.04em] uppercase mt-1.5"
          style={{ color: isDarkSidebar ? 'rgba(255,255,255,0.38)' : undefined }}
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
    <div className="staff-shell page-shell fixed inset-0 flex h-dvh max-h-dvh overflow-hidden bg-brand-bg text-brand-text">
      {mobileNavOpen && (
        <button
          type="button"
          className="staff-sidebar-backdrop lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <aside className={`staff-sidebar staff-sidebar-${themeMode} ${mobileNavOpen ? 'staff-sidebar-open' : ''}`}>
        <button
          type="button"
          className="staff-sidebar-close lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebar}
      </aside>

      <div className="staff-main flex-1 flex flex-col min-w-0 min-h-0">
        {hideHeader ? (
          <header className="staff-main-header staff-main-header-compact shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 border-b border-brand-border lg:hidden">
            <button
              type="button"
              className="p-2 -ml-2 text-brand-text"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <AccountMenu
              userName={currentUser.name}
              userSubtitle={ROLE_LABELS[currentUser.role]}
              avatarUrl={currentUser.avatar}
              onOpenProfile={() => navigate('profile')}
              onOpenSettings={() => navigate('preferences')}
              onSignOut={onSignOut}
              active={activeSection === 'profile' || activeSection === 'preferences'}
            />
          </header>
        ) : (
          <header className="staff-main-header shrink-0 flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-brand-border">
            <button
              type="button"
              className="lg:hidden p-2 -ml-2 text-brand-text"
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
            <AccountMenu
              userName={currentUser.name}
              userSubtitle={ROLE_LABELS[currentUser.role]}
              avatarUrl={currentUser.avatar}
              onOpenProfile={() => navigate('profile')}
              onOpenSettings={() => navigate('preferences')}
              onSignOut={onSignOut}
              active={activeSection === 'profile' || activeSection === 'preferences'}
            />
          </header>
        )}

        <main className={`staff-main-content flex-1 min-h-0 min-w-0 overflow-hidden ${bleed ? '' : 'px-4 py-4 sm:px-5 sm:py-5'}`}>
          <div className={`h-full max-w-full min-w-0 ${bleed ? 'overflow-hidden' : 'overflow-x-hidden overflow-y-auto overscroll-contain'}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export type { StaffSection };
