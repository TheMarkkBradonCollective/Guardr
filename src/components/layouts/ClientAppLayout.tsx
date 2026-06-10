import React from 'react';
import { SessionUser } from '../../types';
import { ClientView } from '../ClientDashboard';
import { RoleAppShell } from './RoleAppShell';
import { ThemeToggle } from '../ui/ThemeToggle';
import { Home, Map, ClipboardList, User, Users, LifeBuoy, Radio, LogOut } from 'lucide-react';

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

const PRIMARY_NAV: { id: ClientView; label: string; icon: typeof Home }[] = [
  { id: 'map', label: 'Map', icon: Map },
  { id: 'home', label: 'Home', icon: Home },
  { id: 'guards', label: 'Guards', icon: Users },
  { id: 'requests', label: 'Jobs', icon: ClipboardList },
];

const OVERFLOW_NAV: { id: ClientView; label: string; icon: typeof Home }[] = [
  { id: 'coverage', label: 'Coverage', icon: Radio },
  { id: 'support', label: 'Support', icon: LifeBuoy },
  { id: 'profile', label: 'Profile', icon: User },
];

const VIEW_TITLES: Partial<Record<ClientView, string>> = {
  map: 'Map',
  home: 'Home',
  guards: 'Guards',
  coverage: 'Live coverage',
  requests: 'Jobs',
  support: 'Support',
  profile: 'Profile',
  request: 'Post job offer',
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

  const themeToggle = <ThemeToggle value={themeMode} onChange={onChangeTheme} size="sm" />;

  const moreFooter = (
    <button type="button" onClick={onSignOut} className="w-full app-button-outline h-11 text-sm mb-4">
      <LogOut className="w-4 h-4" />
      Sign out
    </button>
  );

  return (
    <RoleAppShell
      title={screenTitle}
      locationLabel={clientLabel}
      avatarUrl={currentUser.avatar}
      avatarName={currentUser.name}
      onAvatarClick={() => onNavigate?.('profile')}
      onSignOut={onSignOut}
      navItems={PRIMARY_NAV}
      overflowNavItems={OVERFLOW_NAV}
      activeNavId={activeView}
      onNavigate={(id) => onNavigate?.(id as ClientView)}
      headerRight={themeToggle}
      moreMenuFooter={moreFooter}
      moreMenuTitle="Client menu"
      fullBleed={fullBleed}
      variant={activeView === 'map' ? 'dark' : 'default'}
    >
      {children}
    </RoleAppShell>
  );
}
