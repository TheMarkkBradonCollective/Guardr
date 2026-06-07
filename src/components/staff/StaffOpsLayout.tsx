import React from 'react';
import { Logo } from '../Logo';
import { SessionUser } from '../../types';
import { canAccessFinancialControls, ROLE_LABELS } from '../../lib/permissions';
import { StaffSection } from '../../lib/staffOps';
import { AppBottomNav } from '../layouts/AppBottomNav';
import {
  AlertTriangle,
  BarChart3,
  Building2,
  ClipboardCheck,
  DollarSign,
  FileText,
  LayoutDashboard,
  LogOut,
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
}

const MOBILE_NAV: StaffSection[] = ['overview', 'live-jobs', 'approvals', 'profile'];

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
}: StaffOpsLayoutProps) {
  const showFinance = canAccessFinancialControls(currentUser);

  const NAV: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'approvals', label: 'Approvals', icon: ClipboardCheck, badge: badges.approvals },
    { id: 'live-jobs', label: 'Live Jobs', icon: Radio, badge: badges['live-jobs'] },
    { id: 'guards', label: 'Guards', icon: Shield },
    { id: 'clients', label: 'Clients', icon: Building2 },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle, badge: badges.incidents },
    { id: 'payments', label: 'Payments', icon: DollarSign, adminOnly: true },
    { id: 'disputes', label: 'Disputes', icon: Scale, badge: badges.disputes },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'System Settings', icon: Settings, adminOnly: true },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const visibleNav = NAV.filter((item) => !item.adminOnly || showFinance);

  const mobileNavItems = MOBILE_NAV.map((id) => {
    const item = NAV.find((n) => n.id === id)!;
    return {
      id: item.id,
      label: item.label.split(' ')[0],
      icon: item.icon,
      badge: item.badge,
    };
  });

  return (
    <div className={`theme-${themeMode} fixed inset-0 flex h-dvh max-h-dvh overflow-hidden bg-brand-bg text-brand-text staff-ops-root`}>
      <aside className="hidden md:flex w-56 flex-col border-r border-brand-border bg-black shrink-0">
        <div className="p-4 border-b border-brand-border">
          <div className="flex items-center gap-2">
            <Logo size={24} />
            <div>
              <p className="text-[8px] font-mono uppercase tracking-widest text-brand-text-muted">Guardr</p>
              <p className="font-black text-xs uppercase tracking-tight">Ops Center</p>
            </div>
          </div>
          <p className="text-[9px] font-mono text-brand-text-muted mt-2 leading-relaxed">
            {ROLE_LABELS[currentUser.role]} · Command Room
          </p>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {visibleNav.map(({ id, label, icon: Icon, badge }) => (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-[11px] font-mono font-bold uppercase tracking-wide transition-colors ${
                activeSection === id
                  ? 'bg-brand-primary text-black'
                  : 'text-brand-text-muted hover:text-brand-text hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="flex-1 truncate">{label}</span>
              {badge != null && badge > 0 && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center ${
                  activeSection === id ? 'bg-black/20 text-black' : 'bg-brand-primary/20 text-brand-primary'
                }`}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-brand-border space-y-2">
          {isDbConnected && (
            <p className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              DB connected
            </p>
          )}
          <button
            type="button"
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 border border-brand-border py-2 text-[10px] font-mono font-bold uppercase rounded-lg hover:border-brand-primary transition-colors"
          >
            <LogOut className="w-3 h-3" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <header className="shrink-0 border-b border-brand-border bg-brand-bg-sec px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 md:hidden">
            <Logo size={22} />
            <span className="font-black text-xs uppercase">Ops Center</span>
          </div>
          <p className="hidden md:block text-xs font-mono uppercase tracking-widest text-brand-text-muted">
            Guardr Operations Command Center
          </p>
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
        </header>

        <main className="flex-1 min-h-0 overflow-hidden p-4 sm:p-6 lg:p-8">
          <div className="h-full overflow-y-auto overscroll-contain">{children}</div>
        </main>

        <AppBottomNav
          items={mobileNavItems}
          activeId={activeSection}
          onNavigate={(id) => onNavigate(id as StaffSection)}
          className="md:hidden"
        />
      </div>
    </div>
  );
}

export type { StaffSection };
