import React from 'react';
import { Logo } from '../Logo';
import { SessionUser } from '../../types';
import {
  Briefcase,
  ClipboardList,
  LogOut,
  PlusCircle,
  Shield,
  Activity,
  History,
  ChevronRight,
} from 'lucide-react';

type ThemeMode = 'dark' | 'light' | 'grey';

const THEME_LABELS: Record<ThemeMode, string> = {
  'dark':  'Dark',
  'light': 'Light',
  'grey':  'Grey',
};

interface ClientAppLayoutProps {
  children: React.ReactNode;
  currentUser: SessionUser;
  themeMode: ThemeMode;
  onSignOut: () => void;
  onChangeTheme: (mode: ThemeMode) => void;
  activeSection?: 'requests' | 'post';
  onNavigate?: (section: 'requests' | 'post') => void;
}

export function ClientAppLayout({
  children,
  currentUser,
  themeMode,
  onSignOut,
  onChangeTheme,
  activeSection = 'requests',
  onNavigate,
}: ClientAppLayoutProps) {
  const clientLabel = currentUser.clientName || currentUser.name;
  const initials = clientLabel.slice(0, 2).toUpperCase();

  return (
    <div className={`min-h-screen flex theme-${themeMode} bg-brand-bg text-brand-text`}>
      
      {/* ── SIDEBAR (desktop) ──────────────────────── */}
      <aside className="hidden md:flex w-64 flex-col border-r border-brand-border bg-brand-bg-sec shrink-0">
        
        {/* Brand */}
        <div className="p-5 border-b border-brand-border">
          <div className="flex items-center gap-2.5 mb-4">
            <Logo className="text-brand-primary shrink-0" size={26} />
            <div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-brand-text-muted">Guardr</p>
              <h1 className="font-black text-sm uppercase tracking-tight leading-tight">Client Portal</h1>
            </div>
          </div>
          <p className="text-[10px] font-mono text-brand-text-muted leading-relaxed">
            Post shifts, manage requests, and connect with licensed security contractors.
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          <button
            type="button"
            onClick={() => onNavigate?.('requests')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs font-mono font-bold uppercase tracking-wider transition-all ${
              activeSection === 'requests'
                ? 'bg-brand-primary text-black'
                : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-surface'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 shrink-0" />
            My Shifts
            {activeSection === 'requests' && <ChevronRight className="w-3 h-3 ml-auto" />}
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('post')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs font-mono font-bold uppercase tracking-wider transition-all ${
              activeSection === 'post'
                ? 'bg-brand-primary text-black'
                : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-surface'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 shrink-0" />
            Post New Shift
            {activeSection === 'post' && <ChevronRight className="w-3 h-3 ml-auto" />}
          </button>

          {/* Placeholder nav items */}
          <div className="pt-4 mt-2 border-t border-brand-border space-y-1">
            <div className="flex items-center gap-2.5 px-3 py-2 text-[10px] font-mono uppercase text-brand-text-muted opacity-50 cursor-not-allowed">
              <Activity className="w-3.5 h-3.5 shrink-0" />
              Active Deployments
            </div>
            <div className="flex items-center gap-2.5 px-3 py-2 text-[10px] font-mono uppercase text-brand-text-muted opacity-50 cursor-not-allowed">
              <History className="w-3.5 h-3.5 shrink-0" />
              Shift History
            </div>
          </div>
        </nav>

        {/* User + sign out */}
        <div className="p-4 border-t border-brand-border">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 bg-brand-primary text-black flex items-center justify-center font-black text-xs font-mono shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase truncate">{clientLabel}</p>
              <p className="text-[9px] font-mono text-brand-text-muted uppercase tracking-wider">Client Account</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 border border-brand-border py-2 text-[10px] font-mono font-bold uppercase hover:border-brand-primary hover:text-brand-primary transition-colors"
          >
            <LogOut className="w-3 h-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ───────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top header */}
        <header className="border-b border-brand-border bg-brand-bg-sec px-4 sm:px-6 h-14 flex items-center justify-between gap-4 shrink-0">
          
          {/* Mobile brand */}
          <div className="flex items-center gap-2 md:hidden">
            <Logo className="text-brand-primary shrink-0" size={22} />
            <div>
              <p className="text-[9px] font-mono uppercase text-brand-text-muted tracking-widest">Client</p>
              <p className="font-black text-xs uppercase truncate">{clientLabel}</p>
            </div>
          </div>

          {/* Desktop page title */}
          <div className="hidden md:flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-brand-primary" />
            <h2 className="font-black text-sm uppercase tracking-tight">
              {activeSection === 'post' ? 'Post New Shift' : 'Shift Management'}
            </h2>
          </div>

          {/* Theme switcher + mobile sign out */}
          <div className="flex items-center gap-2">
            <div className="flex border border-brand-border p-0.5 text-[9px] font-mono">
              {(['dark', 'light', 'grey'] as ThemeMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  title={THEME_LABELS[m]}
                  onClick={() => onChangeTheme(m)}
                  className={`px-2 py-1 font-bold uppercase transition-colors ${
                    themeMode === m
                      ? 'bg-brand-primary text-black'
                      : 'text-brand-text-muted hover:text-brand-text'
                  }`}
                >
                  {THEME_LABELS[m]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="md:hidden flex items-center gap-1 border border-brand-border px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase hover:border-brand-primary transition-colors"
            >
              <LogOut className="w-3 h-3" />
              Out
            </button>
          </div>
        </header>

        {/* Mobile nav strip */}
        <div className="md:hidden flex border-b border-brand-border bg-brand-bg-sec">
          <button
            type="button"
            onClick={() => onNavigate?.('requests')}
            className={`flex-1 py-2.5 text-[10px] font-mono font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
              activeSection === 'requests' ? 'bg-brand-primary text-black' : 'text-brand-text-muted hover:text-brand-text'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            My Shifts
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('post')}
            className={`flex-1 py-2.5 text-[10px] font-mono font-black uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 ${
              activeSection === 'post' ? 'bg-brand-primary text-black' : 'text-brand-text-muted hover:text-brand-text'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Post Shift
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-brand-border px-6 py-3 text-[9px] font-mono uppercase text-brand-text-muted flex items-center justify-between shrink-0">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-brand-primary" />
            Independent contractor marketplace — not a vetting agency
          </span>
          <span>Guardr © {new Date().getFullYear()}</span>
        </footer>
      </div>
    </div>
  );
}
