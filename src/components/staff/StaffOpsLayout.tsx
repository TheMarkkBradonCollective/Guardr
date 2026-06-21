import React, { useState } from 'react';
import { SessionUser } from '../../types';
import { canAccessFinancialControls, ROLE_LABELS } from '../../lib/permissions';
import { isStaffOpsMapSection, StaffSection } from '../../lib/staffOps';
import { StaffSidebarNav, StaffNavItem } from './StaffSidebarNav';
import { ThemeToggle } from '../ui/ThemeToggle';
import { ProfileAvatar } from '../profile/ProfileAvatar';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  Briefcase,
  ClipboardCheck,
  DollarSign,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Map,
  Menu,
  MessageSquare,
  Scale,
  Settings,
  Shield,
  User,
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
  support: 'Support inbox',
  messages: 'Messages',
  payments: 'Payments',
  disputes: 'Disputes',
  analytics: 'Analytics',
  settings: 'System Settings',
  profile: 'Profile',
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
}: StaffOpsLayoutProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const showFinance = canAccessFinancialControls(currentUser);
  const bleed =
    fullBleed ||
    isStaffOpsMapSection(activeSection) ||
    activeSection === 'support' ||
    activeSection === 'messages';

  const navItems: StaffNavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'jobs', label: 'Jobs', icon: Briefcase, badge: badges.jobs },
    { id: 'approvals', label: 'Approvals', icon: ClipboardCheck, badge: badges.approvals },
    { id: 'clients', label: 'Clients', icon: Building2 },
    { id: 'guards', label: 'Guards', icon: Shield },
    { id: 'team', label: 'Staff', icon: Users },
    { id: 'support', label: 'Support', icon: LifeBuoy, badge: badges.support },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: badges.messages },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle, badge: badges.incidents },
    { id: 'disputes', label: 'Disputes', icon: Scale, badge: badges.disputes },
    { id: 'payments', label: 'Payments', icon: DollarSign, badge: badges.payments, adminOnly: true },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings, adminOnly: true },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const navigate = (section: StaffSection) => {
    onNavigate(section);
    setMobileNavOpen(false);
  };

  const sidebar = (
    <div className="staff-sidebar-inner">
      <div className="staff-sidebar-brand">
        <p className="font-bold text-base tracking-tight">Guardr</p>
        <p className="text-xs text-brand-text-muted mt-0.5">{ROLE_LABELS[currentUser.role]}</p>
      </div>
      <div className="staff-sidebar-nav flex-1 min-h-0 overflow-y-auto overscroll-contain">
        <StaffSidebarNav
          items={navItems}
          activeSection={activeSection}
          onNavigate={navigate}
          showFinance={showFinance}
        />
      </div>
      <div className="staff-sidebar-footer">
        <ThemeToggle value={themeMode} onChange={onChangeTheme} size="sm" className="w-full justify-center" />
        {isDbConnected && (
          <p className="text-[10px] text-brand-primary flex items-center gap-1.5 justify-center mt-3">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
            Connected
          </p>
        )}
        <button type="button" onClick={onSignOut} className="w-full app-button-outline !h-10 !text-xs mt-3">
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
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

      <aside className={`staff-sidebar ${mobileNavOpen ? 'staff-sidebar-open' : ''}`}>
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
        <header className="staff-main-header shrink-0 flex items-center gap-3 px-4 sm:px-5 py-3 border-b border-brand-border bg-brand-bg">
          <button
            type="button"
            className="lg:hidden p-2 -ml-2 text-brand-text"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold truncate">{SECTION_TITLES[activeSection]}</h1>
            <p className="text-xs text-brand-text-muted truncate">{currentUser.name}</p>
          </div>
          <div className="shrink-0 flex items-center gap-1">
            <button
              type="button"
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 h-9 px-2 sm:px-2.5 rounded-lg text-xs font-medium text-brand-text-muted hover:text-brand-text hover:bg-brand-border/20 transition-colors"
              aria-label="Log out"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Log out</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('profile')}
              className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
              aria-label="Open profile"
            >
              <ProfileAvatar src={currentUser.avatar} name={currentUser.name} size="sm" />
            </button>
          </div>
        </header>

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
