import React from 'react';
import { SessionUser } from '../../types';
import { ClientView } from '../ClientDashboard';
import { RoleAppShell } from './RoleAppShell';
import { Home, Map, Radio, ClipboardList, User, Users, LifeBuoy, LogOut } from 'lucide-react';

type ThemeMode = 'dark' | 'light' | 'grey';

interface ClientAppLayoutProps {
  children: React.ReactNode;
  currentUser: SessionUser;
  themeMode: ThemeMode;
  onSignOut: () => void;
  onChangeTheme: (mode: ThemeMode) => void;
  activeView?: ClientView;
  onNavigate?: (view: ClientView) => void;
}

const NAV: { id: ClientView; label: string; icon: typeof Home }[] = [
  { id: 'map', label: 'Map', icon: Map },
  { id: 'home', label: 'Home', icon: Home },
  { id: 'guards', label: 'Guards', icon: Users },
  { id: 'coverage', label: 'Coverage', icon: Radio },
  { id: 'requests', label: 'Requests', icon: ClipboardList },
  { id: 'support', label: 'Support', icon: LifeBuoy },
  { id: 'profile', label: 'Profile', icon: User },
];

const VIEW_TITLES: Partial<Record<ClientView, string>> = {
  map: 'Map',
  home: 'Home',
  guards: 'Guards',
  coverage: 'Live coverage',
  requests: 'Requests',
  support: 'Support',
  profile: 'Profile',
  request: 'New request',
  'direct-request': 'Request guard',
  reports: 'Reports',
};

export function ClientAppLayout({
  children,
  currentUser,
  themeMode,
  onSignOut,
  onChangeTheme,
  activeView = 'map',
  onNavigate,
}: ClientAppLayoutProps) {
  const clientLabel = currentUser.clientName || currentUser.name;
  const screenTitle = VIEW_TITLES[activeView] ?? 'Client dashboard';
  const fullBleed = activeView === 'map' || activeView === 'coverage';

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
    <button
      type="button"
      onClick={onSignOut}
      className="w-full flex items-center justify-center gap-2 border border-brand-border py-2 text-[10px] font-mono font-bold uppercase rounded-lg hover:border-brand-primary transition-colors"
    >
      <LogOut className="w-3 h-3" />
      Sign Out
    </button>
  );

  return (
    <RoleAppShell
      title={screenTitle}
      subtitle={clientLabel}
      sidebarTitle="Guardr"
      sidebarSubtitle="Client"
      navItems={NAV}
      activeNavId={activeView}
      onNavigate={(id) => onNavigate?.(id as ClientView)}
      headerRight={themeToggle}
      sidebarFooter={sidebarFooter}
      fullBleed={fullBleed}
      variant={activeView === 'map' ? 'dark' : 'default'}
    >
      {children}
    </RoleAppShell>
  );
}
