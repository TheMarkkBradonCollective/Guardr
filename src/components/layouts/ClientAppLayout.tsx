import React from 'react';
import { SessionUser } from '../../types';
import { ClientView } from '../ClientDashboard';
import { RoleAppShell } from './RoleAppShell';
import { Home, Radio, ClipboardList, User } from 'lucide-react';

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
  { id: 'home', label: 'Home', icon: Home },
  { id: 'coverage', label: 'Coverage', icon: Radio },
  { id: 'requests', label: 'Requests', icon: ClipboardList },
  { id: 'profile', label: 'Profile', icon: User },
];

export function ClientAppLayout({
  children,
  currentUser,
  themeMode,
  activeView = 'home',
  onNavigate,
}: ClientAppLayoutProps) {
  const clientLabel = currentUser.clientName || currentUser.name;
  const hideBottomNav = activeView === 'request';

  return (
    <div className={`theme-${themeMode} h-full`}>
      <RoleAppShell
        title={clientLabel}
        subtitle="Client"
        navItems={NAV}
        activeNavId={hideBottomNav ? 'home' : activeView}
        onNavigate={(id) => onNavigate?.(id as ClientView)}
        hideBottomNav={hideBottomNav}
      >
        <div className="h-full overflow-hidden">{children}</div>
      </RoleAppShell>
    </div>
  );
}
