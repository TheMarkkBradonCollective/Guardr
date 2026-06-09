import React from 'react';
import { SessionUser } from '../../types';
import { ClientView } from '../ClientDashboard';
import { RoleAppShell } from './RoleAppShell';
import { Home, MessageSquare, Calendar, Pill, Activity, User, LifeBuoy, LogOut } from 'lucide-react';

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
  { id: 'home', label: 'Home', icon: Home },
  { id: 'message', label: 'Message', icon: MessageSquare },
  { id: 'appointment', label: 'Appointment', icon: Calendar },
  { id: 'medication', label: 'Medication', icon: Pill },
  { id: 'tracker', label: 'Tracker', icon: Activity },
];

const OVERFLOW_NAV: { id: ClientView; label: string; icon: typeof Home }[] = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'support', label: 'Support', icon: LifeBuoy },
];

const SHELL_HEADER_VIEWS: ClientView[] = ['profile', 'support'];

const VIEW_TITLES: Partial<Record<ClientView, string>> = {
  profile: 'Profile',
  support: 'Support',
};

export function ClientAppLayout({
  children,
  currentUser,
  onSignOut,
  activeView = 'home',
  onNavigate,
}: ClientAppLayoutProps) {
  const showShellHeader = SHELL_HEADER_VIEWS.includes(activeView);
  const screenTitle = VIEW_TITLES[activeView] ?? '';

  const moreFooter = (
    <button type="button" onClick={onSignOut} className="w-full app-button-outline h-11 text-sm mb-4">
      <LogOut className="w-4 h-4" />
      Sign out
    </button>
  );

  return (
    <RoleAppShell
      title={screenTitle}
      avatarUrl={currentUser.avatar}
      avatarName={currentUser.name}
      onAvatarClick={() => onNavigate?.('profile')}
      navItems={PRIMARY_NAV}
      overflowNavItems={OVERFLOW_NAV}
      activeNavId={activeView === 'search' ? 'home' : activeView}
      onNavigate={(id) => onNavigate?.(id as ClientView)}
      moreMenuFooter={moreFooter}
      moreMenuTitle="Menu"
      fullBleed
      hideHeader={!showShellHeader}
      flatNav
    >
      {children}
    </RoleAppShell>
  );
}
