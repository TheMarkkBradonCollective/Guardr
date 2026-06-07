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
} from 'lucide-react';

type ThemeMode = 'sage-dark' | 'sage-light' | 'grey-dark' | 'grey-light';

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

  return (
    <div className={`min-h-screen flex theme-${themeMode} bg-brand-bg text-brand-text`}>
      <aside className="hidden lg:flex w-72 flex-col border-r border-brand-border bg-brand-bg-sec">
        <div className="p-6 border-b border-brand-border">
          <div className="flex items-center gap-2 mb-3">
            <Logo className="text-brand-primary shrink-0" size={28} />
            <div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-brand-text-muted">Guardr</p>
              <h1 className="font-black text-sm uppercase tracking-tight">Client Portal</h1>
            </div>
          </div>
          <p className="text-[10px] font-mono text-brand-text-muted leading-relaxed">
            Post shifts, review applicants, and manage your independent contractor security coverage.
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            type="button"
            onClick={() => onNavigate?.('requests')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-xs font-mono uppercase tracking-wider transition-colors ${
              activeSection === 'requests'
                ? 'bg-brand-primary text-black font-black'
                : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-bg'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            My Shift Requests
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('post')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-xs font-mono uppercase tracking-wider transition-colors ${
              activeSection === 'post'
                ? 'bg-brand-primary text-black font-black'
                : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-bg'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            Post New Shift
          </button>
          <div className="pt-4 mt-4 border-t border-brand-border space-y-1 opacity-70">
            <div className="flex items-center gap-3 px-3 py-2 text-[10px] font-mono uppercase text-brand-text-muted">
              <Activity className="w-4 h-4" />
              Active Deployments
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-[10px] font-mono uppercase text-brand-text-muted">
              <History className="w-4 h-4" />
              Shift History
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-brand-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 bg-brand-primary text-black flex items-center justify-center font-bold text-xs font-mono">
              {clientLabel.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold uppercase">{clientLabel}</p>
              <p className="text-[9px] font-mono text-brand-text-muted uppercase">Corporate Client</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 border border-brand-border py-2 text-[10px] font-mono uppercase font-bold hover:bg-brand-bg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-brand-border bg-brand-bg-sec px-4 sm:px-6 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 lg:hidden">
              <Logo className="text-brand-primary" size={24} />
              <div>
                <p className="text-[9px] font-mono uppercase text-brand-text-muted">Client Portal</p>
                <h2 className="font-bold text-sm uppercase">{clientLabel}</h2>
              </div>
            </div>
            <div className="hidden lg:block">
              <p className="text-[9px] font-mono uppercase text-brand-text-muted">Workspace</p>
              <h2 className="font-bold text-lg uppercase tracking-tight flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-brand-primary" />
                Shift Management Desk
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex p-0.5 border border-brand-border text-[8px] font-mono">
                {(['sage-dark', 'sage-light', 'grey-dark', 'grey-light'] as ThemeMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onChangeTheme(mode)}
                    className={`px-2 py-1 uppercase font-bold ${
                      themeMode === mode ? 'bg-brand-primary text-black' : 'text-brand-text-muted'
                    }`}
                  >
                    {mode.split('-')[0]}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className="lg:hidden flex items-center gap-1 border border-brand-border px-2 py-1 text-[10px] font-mono uppercase"
              >
                <LogOut className="w-3 h-3" />
                Out
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>

        <footer className="border-t border-brand-border px-6 py-3 text-[9px] font-mono uppercase text-brand-text-muted flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-brand-primary" />
            Independent contractor marketplace — not a vetting agency
          </span>
          <span>Guardr Client • {new Date().getFullYear()}</span>
        </footer>
      </div>
    </div>
  );
}
