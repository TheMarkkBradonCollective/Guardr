import React, { useState } from 'react';
import { SessionUser } from '../../types';
import { canAccessFinancialControls, ROLE_LABELS } from '../../lib/permissions';
import { StaffSection } from '../../lib/staffOps';
import { AppScreenHeader } from '../layouts/AppScreenHeader';
import { SidebarDrawer } from '../layouts/SidebarDrawer';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  ClipboardCheck,
  DollarSign,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Map,
  Radio,
  Scale,
  Settings,
  Shield,
  User,
} from 'lucide-react';

type ThemeMode = 'dark' | 'light' | 'grey';

interface NavItem {
  id: StaffSection;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: number;
  adminOnly?: boolean;
}

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
  onEnterGuardMode?: () => void;
}

const SECTION_TITLES: Record<StaffSection, string> = {
  overview: 'Overview',
  approvals: 'Approvals',
  'live-jobs': 'Live Jobs',
  guards: 'Guards',
  clients: 'Clients',
  reports: 'Reports',
  incidents: 'Incidents',
  support: 'Support',
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
  onEnterGuardMode,
}: StaffOpsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const showFinance = canAccessFinancialControls(currentUser);

  const NAV: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'approvals', label: 'Approvals', icon: ClipboardCheck, badge: badges.approvals },
    { id: 'live-jobs', label: 'Live Jobs', icon: Radio, badge: badges['live-jobs'] },
    { id: 'guards', label: 'Guards', icon: Shield },
    { id: 'clients', label: 'Clients', icon: Building2 },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle, badge: badges.incidents },
    { id: 'support', label: 'Support', icon: LifeBuoy, badge: badges.support },
    { id: 'payments', label: 'Payments', icon: DollarSign, adminOnly: true },
    { id: 'disputes', label: 'Disputes', icon: Scale, badge: badges.disputes },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'System Settings', icon: Settings, adminOnly: true },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const visibleNav = NAV.filter((item) => !item.adminOnly || showFinance);

  const navigate = (section: StaffSection) => {
    onNavigate(section);
    setSidebarOpen(false);
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

  const drawerFooter = (
    <>
      {onEnterGuardMode && (
        <button
          type="button"
          onClick={() => {
            setSidebarOpen(false);
            onEnterGuardMode();
          }}
          className="w-full flex items-center justify-center gap-2 bg-brand-primary/15 border border-brand-primary/30 py-2.5 text-[10px] font-mono font-bold uppercase rounded-lg text-brand-primary hover:bg-brand-primary/25 transition-colors"
        >
          <Map className="w-3.5 h-3.5" />
          Guard map &amp; shifts
        </button>
      )}
      {isDbConnected && (
        <p className="text-[9px] font-mono text-emerald-400 flex items-center gap-1 justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          DB connected
        </p>
      )}
      <button
        type="button"
        onClick={() => {
          setSidebarOpen(false);
          onSignOut();
        }}
        className="w-full flex items-center justify-center gap-2 border border-brand-border py-2 text-[10px] font-mono font-bold uppercase rounded-lg hover:border-brand-primary transition-colors"
      >
        <LogOut className="w-3 h-3" />
        Sign Out
      </button>
    </>
  );

  return (
    <div className="page-shell fixed inset-0 flex flex-col h-dvh max-h-dvh overflow-hidden staff-ops-root">
      <AppScreenHeader
        title={SECTION_TITLES[activeSection]}
        subtitle={`${ROLE_LABELS[currentUser.role]} · Ops Center`}
        onMenuClick={() => setSidebarOpen(true)}
        menuLabel="Open staff menu"
        right={themeToggle}
      />

      <main className="flex-1 min-h-0 overflow-hidden p-4 sm:p-6 lg:p-8">
        <div className="h-full overflow-y-auto overscroll-contain">{children}</div>
      </main>

      <SidebarDrawer
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        title="Ops Center"
        subtitle="Guardr Staff"
        footer={drawerFooter}
      >
        <nav className="space-y-0.5" aria-label="Staff navigation">
          {visibleNav.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              type="button"
              onClick={() => navigate(id)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-colors ${
                activeSection === id
                  ? 'bg-brand-primary text-brand-accent-text'
                  : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-surface'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate">{label}</span>
              {badge != null && badge > 0 && (
                <span
                  className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center ${
                    activeSection === id
                      ? 'bg-brand-accent-text/20 text-brand-accent-text'
                      : 'bg-brand-primary/15 text-brand-primary'
                  }`}
                >
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </SidebarDrawer>
    </div>
  );
}

export type { StaffSection };
