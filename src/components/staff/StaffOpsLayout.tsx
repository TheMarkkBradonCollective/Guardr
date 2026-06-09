import React, { useState } from 'react';
import { SessionUser } from '../../types';
import { canAccessFinancialControls, ROLE_LABELS } from '../../lib/permissions';
import { isStaffOpsMapSection, StaffSection } from '../../lib/staffOps';
import { AppScreenHeader } from '../layouts/AppScreenHeader';
import { BottomNavBar, BottomNavItem } from '../layouts/BottomNavBar';
import { MoreMenuSheet } from '../layouts/MoreMenuSheet';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  ClipboardCheck,
  DollarSign,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Map,
  Briefcase,
  Scale,
  Settings,
  Shield,
  User,
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
  approvals: 'Verification',
  jobs: 'Jobs',
  map: 'Operations map',
  guards: 'Guards',
  clients: 'Clients',
  incidents: 'Client incidents',
  support: 'Support inbox',
  payments: 'Payments',
  disputes: 'Disputes',
  analytics: 'Analytics',
  settings: 'System Settings',
  profile: 'Profile',
};

const PRIMARY_SECTIONS: StaffSection[] = ['overview', 'map', 'jobs', 'approvals'];

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
  const [moreOpen, setMoreOpen] = useState(false);
  const showFinance = canAccessFinancialControls(currentUser);
  const bleed = fullBleed || isStaffOpsMapSection(activeSection);

  const allItems: (BottomNavItem & { id: StaffSection; adminOnly?: boolean })[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'jobs', label: 'Jobs', icon: Briefcase, badge: badges.jobs },
    { id: 'approvals', label: 'Verify', icon: ClipboardCheck, badge: badges.approvals },
    { id: 'guards', label: 'Guards', icon: Shield },
    { id: 'clients', label: 'Clients', icon: Building2 },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle, badge: badges.incidents },
    { id: 'support', label: 'Support', icon: LifeBuoy, badge: badges.support },
    { id: 'payments', label: 'Payments', icon: DollarSign, adminOnly: true },
    { id: 'disputes', label: 'Disputes', icon: Scale, badge: badges.disputes },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings, adminOnly: true },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const visible = allItems.filter((i) => !i.adminOnly || showFinance);
  const primaryNav = visible.filter((i) => PRIMARY_SECTIONS.includes(i.id as StaffSection));
  const overflowNav = visible.filter((i) => !PRIMARY_SECTIONS.includes(i.id as StaffSection));
  const moreActive = overflowNav.some((i) => i.id === activeSection);
  const moreBadge = overflowNav.reduce((sum, i) => sum + (i.badge ?? 0), 0);

  const navigate = (section: StaffSection) => {
    onNavigate(section);
    setMoreOpen(false);
  };

  const themeToggle = (
    <div className="segmented-control">
      {(['dark', 'light', 'grey'] as ThemeMode[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChangeTheme(m)}
          className={`segmented-control-btn ${themeMode === m ? 'segmented-control-btn-active' : ''}`}
        >
          {m === 'grey' ? 'Shade' : m}
        </button>
      ))}
    </div>
  );

  const moreFooter = (
    <div className="space-y-3 pb-4">
      {isDbConnected && (
        <p className="text-xs text-emerald-500 flex items-center gap-1.5 justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Database connected
        </p>
      )}
      <button type="button" onClick={onSignOut} className="w-full app-button-outline h-11 text-sm">
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </div>
  );

  return (
    <div className="page-shell fixed inset-0 flex flex-col h-dvh max-h-dvh overflow-hidden staff-ops-root bg-brand-bg text-brand-text">
      <AppScreenHeader
        title={SECTION_TITLES[activeSection]}
        subtitle={`${ROLE_LABELS[currentUser.role]} · Guardr`}
        right={themeToggle}
      />

      <main className={`flex-1 min-h-0 min-w-0 overflow-hidden ${bleed ? '' : 'px-4 py-4 sm:px-5 sm:py-5'}`}>
        <div className={`h-full ${bleed ? 'overflow-hidden' : 'overflow-y-auto overscroll-contain'}`}>
          {children}
        </div>
      </main>

      <BottomNavBar
        items={primaryNav}
        activeId={activeSection}
        onNavigate={(id) => navigate(id as StaffSection)}
        showMore
        moreActive={moreActive}
        moreBadge={moreBadge}
        onMoreClick={() => setMoreOpen(true)}
      />

      <MoreMenuSheet
        open={moreOpen}
        title="Staff menu"
        items={overflowNav}
        activeId={activeSection}
        onNavigate={(id) => navigate(id as StaffSection)}
        onClose={() => setMoreOpen(false)}
        footer={moreFooter}
      />
    </div>
  );
}

export type { StaffSection };
