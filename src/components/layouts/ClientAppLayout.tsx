import React from 'react';
import { SessionUser } from '../../types';
import { ClientView } from '../ClientDashboard';
import { RoleAppShell } from './RoleAppShell';
import { LegalFooterLinks } from '../legal/LegalFooterLinks';
import type { LegalPageId } from '../../lib/legalContent';
import { Home, Map, ClipboardList, Users, LifeBuoy, Radio, FileText } from 'lucide-react';

type ThemeMode = 'dark' | 'light' | 'grey';

interface ClientAppLayoutProps {
  children: React.ReactNode;
  currentUser: SessionUser;
  themeMode: ThemeMode;
  onSignOut: () => void;
  onChangeTheme: (mode: ThemeMode) => void;
  activeView?: ClientView;
  onNavigate?: (view: ClientView) => void;
  accountPending?: boolean;
  onOpenLegal?: (page: LegalPageId) => void;
}

const PRIMARY_NAV: { id: ClientView; label: string; icon: typeof Home }[] = [
  { id: 'map', label: 'Map', icon: Map },
  { id: 'home', label: 'Home', icon: Home },
  { id: 'guards', label: 'Guards', icon: Users },
  { id: 'requests', label: 'Jobs', icon: ClipboardList },
];

const OVERFLOW_NAV: { id: ClientView; label: string; icon: typeof Home }[] = [
  { id: 'coverage', label: 'Coverage', icon: Radio },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'support', label: 'Support', icon: LifeBuoy },
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
  accountPending = false,
  onOpenLegal,
}: ClientAppLayoutProps) {
  const clientLabel = currentUser.clientName || currentUser.name;
  const screenTitle = VIEW_TITLES[activeView] ?? 'Client dashboard';
  const fullBleed = activeView === 'map' || activeView === 'coverage';
  const navHighlightView =
    accountPending && !['home', 'profile', 'support'].includes(activeView) ? 'home' : activeView;

  const moreFooter = onOpenLegal ? (
    <LegalFooterLinks onOpenLegal={onOpenLegal} className="justify-center" />
  ) : undefined;

  return (
    <RoleAppShell
      title={screenTitle}
      locationLabel={clientLabel}
      accountMenu={{
        userName: currentUser.name,
        userSubtitle: currentUser.email,
        avatarUrl: currentUser.avatar,
        themeMode,
        onChangeTheme,
        onOpenProfile: () => onNavigate?.('profile'),
        onSignOut,
        active: activeView === 'profile',
      }}
      navItems={PRIMARY_NAV}
      overflowNavItems={OVERFLOW_NAV}
      activeNavId={navHighlightView}
      onNavigate={(id) => onNavigate?.(id as ClientView)}
      moreMenuFooter={moreFooter}
      moreMenuTitle="More"
      fullBleed={fullBleed}
      variant={activeView === 'map' ? 'dark' : 'default'}
      experience="client"
    >
      {children}
    </RoleAppShell>
  );
}
