import React, { useState } from 'react';
import { SessionUser } from '../../types';
import { canAccessFinancialControls, ROLE_LABELS } from '../../lib/permissions';
import { isStaffShiftSection, StaffSection } from '../../lib/staffOps';
import { AppScreenHeader } from '../layouts/AppScreenHeader';
import { SidebarDrawer } from '../layouts/SidebarDrawer';
import { StaffNavItem, StaffSidebarNav } from './StaffSidebarNav';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  ClipboardCheck,
  Compass,
  DollarSign,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Map,
  MessageCircle,
  Radio,
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
  showShiftNav?: boolean;
  fullBleed?: boolean;
}

const SECTION_TITLES: Record<StaffSection, string> = {
  overview: 'Overview',
  approvals: 'Approvals',
  'live-jobs': 'Live Jobs',
  map: 'Shift map',
  'my-jobs': 'My jobs',
  'my-pay': 'My pay',
  'my-help': 'Get help',
  guards: 'Guards',
  clients: 'Clients',
  reports: 'Reports',
  incidents: 'Client incidents',
  support: 'Support inbox',
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
  showShiftNav = true,
  fullBleed = false,
}: StaffOpsLayoutProps) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const showFinance = canAccessFinancialControls(currentUser);
  const bleed = fullBleed || isStaffShiftSection(activeSection);

  const NAV: StaffNavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'approvals', label: 'Approvals', icon: ClipboardCheck, badge: badges.approvals },
    { id: 'live-jobs', label: 'Live Jobs', icon: Radio, badge: badges['live-jobs'] },
    { id: 'map', label: 'Map', icon: Map },
    { id: 'my-jobs', label: 'My Jobs', icon: Compass },
    { id: 'my-pay', label: 'My Pay', icon: DollarSign },
    { id: 'my-help', label: 'Get Help', icon: MessageCircle },
    { id: 'guards', label: 'Guards', icon: Shield },
    { id: 'clients', label: 'Clients', icon: Building2 },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'incidents', label: 'Client incidents', icon: AlertTriangle, badge: badges.incidents },
    { id: 'support', label: 'Support inbox', icon: LifeBuoy, badge: badges.support },
    { id: 'payments', label: 'Payments', icon: DollarSign, adminOnly: true },
    { id: 'disputes', label: 'Disputes', icon: Scale, badge: badges.disputes },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'System Settings', icon: Settings, adminOnly: true },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const navigate = (section: StaffSection) => {
    onNavigate(section);
    setMobileSidebarOpen(false);
  };

  const themeToggle = (
    <div className="flex border border-brand-border rounded-lg overflow-hidden text-[9px] font-mono">
      {(['dark', 'light', 'grey'] as ThemeMode[]).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChangeTheme(m)}
          className={`px-2 py-1 font-bold uppercase ${themeMode === m ? 'bg-brand-primary text-black' : 'text-brand-text-muted'}`}
        >
          {m}
        </button>
      ))}
    </div>
  );

  const sidebarFooter = (
    <>
      {isDbConnected && (
        <p className="text-[9px] font-mono text-emerald-400 flex items-center gap-1 justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          DB connected
        </p>
      )}
      <button
        type="button"
        onClick={() => {
          setMobileSidebarOpen(false);
          onSignOut();
        }}
        className="w-full flex items-center justify-center gap-2 border border-brand-border py-2 text-[10px] font-mono font-bold uppercase rounded-lg hover:border-brand-primary transition-colors"
      >
        <LogOut className="w-3 h-3" />
        Sign Out
      </button>
    </>
  );

  const sidebarNav = (
    <StaffSidebarNav
      items={NAV}
      activeSection={activeSection}
      onNavigate={navigate}
      showFinance={showFinance}
      showShiftNav={showShiftNav}
    />
  );

  return (
    <div className="page-shell fixed inset-0 flex flex-col h-dvh max-h-dvh overflow-hidden staff-ops-root">
      <AppScreenHeader
        title={SECTION_TITLES[activeSection]}
        subtitle={`${ROLE_LABELS[currentUser.role]} · Guardr`}
        onMenuClick={() => setMobileSidebarOpen(true)}
        menuLabel="Open menu"
        menuClassName="md:hidden"
        right={themeToggle}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-brand-border bg-brand-bg-sec">
          <div className="p-4 border-b border-brand-border">
            <p className="text-[9px] font-mono uppercase tracking-widest text-brand-text-muted">Guardr Staff</p>
            <p className="font-black text-xs uppercase tracking-tight mt-0.5">Ops &amp; shifts</p>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2">{sidebarNav}</div>
          <div className="shrink-0 p-3 border-t border-brand-border space-y-2">{sidebarFooter}</div>
        </aside>

        <main className={`flex-1 min-w-0 min-h-0 overflow-hidden ${bleed ? '' : 'p-4 sm:p-6 lg:p-8'}`}>
          <div className={`h-full ${bleed ? 'overflow-hidden' : 'overflow-y-auto overscroll-contain'}`}>
            {children}
          </div>
        </main>
      </div>

      <SidebarDrawer
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        title="Guardr Staff"
        subtitle="Ops & shifts"
        footer={sidebarFooter}
      >
        {sidebarNav}
      </SidebarDrawer>
    </div>
  );
}

export type { StaffSection };
