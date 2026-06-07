import React from 'react';
import { Logo } from '../Logo';
import { SessionUser } from '../../types';
import { ClientView } from '../ClientDashboard';
import {
  ClipboardList,
  Home,
  LogOut,
  Radio,
  Shield,
} from 'lucide-react';

type ThemeMode = 'dark' | 'light' | 'grey';

const THEME_LABELS: Record<ThemeMode, string> = {
  dark: 'Dark',
  light: 'Light',
  grey: 'Grey',
};

interface ClientAppLayoutProps {
  children: React.ReactNode;
  currentUser: SessionUser;
  themeMode: ThemeMode;
  onSignOut: () => void;
  onChangeTheme: (mode: ThemeMode) => void;
  activeView?: ClientView;
  onNavigate?: (view: ClientView) => void;
}

const NAV_ITEMS: { id: ClientView; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'coverage', label: 'Coverage', icon: Radio },
  { id: 'requests', label: 'Requests', icon: ClipboardList },
];

export function ClientAppLayout({
  children,
  currentUser,
  themeMode,
  onSignOut,
  onChangeTheme,
  activeView = 'home',
  onNavigate,
}: ClientAppLayoutProps) {
  const clientLabel = currentUser.clientName || currentUser.name;
  const initials = clientLabel.slice(0, 2).toUpperCase();
  const isFlowView = activeView === 'request';

  return (
    <div className={`min-h-screen flex theme-${themeMode} bg-brand-bg text-brand-text`}>
      <aside className="hidden lg:flex w-60 flex-col border-r border-brand-border bg-brand-bg-sec shrink-0">
        <div className="p-5 border-b border-brand-border">
          <div className="flex items-center gap-2.5">
            <Logo className="text-brand-primary shrink-0" size={26} />
            <div>
              <p className="text-[9px] font-mono uppercase tracking-widest text-brand-text-muted">Guardr</p>
              <h1 className="font-black text-sm uppercase tracking-tight">Client</h1>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate?.(id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-xs font-mono font-bold uppercase tracking-wider transition-all rounded-lg ${
                activeView === id
                  ? 'bg-brand-primary text-black'
                  : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-surface'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-brand-border">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 bg-brand-primary text-black flex items-center justify-center font-black text-xs font-mono shrink-0 rounded-lg">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black truncate">{clientLabel}</p>
              <p className="text-[9px] font-mono text-brand-text-muted uppercase">Client</p>
            </div>
          </div>
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

      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-brand-border bg-brand-bg-sec px-4 sm:px-6 h-14 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2 lg:hidden">
            <Logo className="text-brand-primary shrink-0" size={22} />
            <p className="font-black text-xs uppercase truncate">{clientLabel}</p>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-brand-text-muted">
            <Shield className="w-4 h-4 text-brand-primary" />
            <span className="text-xs font-mono uppercase tracking-wide">Operations Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border border-brand-border p-0.5 text-[9px] font-mono rounded-lg overflow-hidden">
              {(['dark', 'light', 'grey'] as ThemeMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onChangeTheme(m)}
                  className={`px-2 py-1 font-bold uppercase transition-colors ${
                    themeMode === m ? 'bg-brand-primary text-black' : 'text-brand-text-muted hover:text-brand-text'
                  }`}
                >
                  {THEME_LABELS[m]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="lg:hidden flex items-center gap-1 border border-brand-border px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase rounded-lg"
            >
              <LogOut className="w-3 h-3" />
            </button>
          </div>
        </header>

        {!isFlowView && (
          <div className="lg:hidden flex border-b border-brand-border bg-brand-bg-sec">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => onNavigate?.(id)}
                className={`flex-1 py-2.5 text-[10px] font-mono font-black uppercase flex items-center justify-center gap-1 ${
                  activeView === id ? 'bg-brand-primary text-black' : 'text-brand-text-muted'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        )}

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        <footer className="border-t border-brand-border px-6 py-3 text-[9px] font-mono uppercase text-brand-text-muted flex items-center justify-between shrink-0">
          <span className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-brand-primary" />
            Independent contractor marketplace
          </span>
          <span>Guardr © {new Date().getFullYear()}</span>
        </footer>
      </div>
    </div>
  );
}
