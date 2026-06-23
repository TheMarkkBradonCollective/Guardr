import React from 'react';
import { SessionUser } from '../../types';
import { ClientView } from '../ClientDashboard';
import { RoleAppShell } from './RoleAppShell';
import { LegalFooterLinks } from '../legal/LegalFooterLinks';
import type { LegalPageId } from '../../lib/legalContent';
import { MessagesSquare, Home, Map, ClipboardList, Users, LifeBuoy, Radio, FileText, BookOpen } from 'lucide-react';

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
  messagesBadge?: number;
}

const PRIMARY_NAV: { id: ClientView; label: string; icon: typeof Home }[] = [
  { id: 'map', label: 'Map', icon: Map },
  { id: 'home', label: 'Home', icon: Home },
  { id: 'guards', label: 'Guards', icon: Users },
  { id: 'requests', label: 'Jobs', icon: ClipboardList },
];

const OVERFLOW_NAV: { id: ClientView; label: string; icon: typeof Home }[] = [
  { id: 'messages', label: 'Messages', icon: MessagesSquare },
  { id: 'coverage', label: 'Coverage', icon: Radio },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'guide', label: 'Workflow guide', icon: BookOpen },
  { id: 'support', label: 'Support', icon: LifeBuoy },
];

const VIEW_TITLES: Partial<Record<ClientView, string>> = {
  map: 'Map',
  home: 'Home',
  guards: 'Guards',
  coverage: 'Live coverage',
  requests: 'Jobs',
  support: 'Support',
  'support-compose': 'Contact support',
  'support-report': 'File a report',
  profile: 'Profile',
  request: 'Post job offer',
  'direct-request': 'Request guard',
  reports: 'Reports',
  guide: 'Workflow guide',
  messages: 'Messages',
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
  messagesBadge = 0,
}: ClientAppLayoutProps) {
  const clientLabel = currentUser.clientName || currentUser.name;
  const screenTitle = VIEW_TITLES[activeView] ?? 'Client dashboard';
  const fullBleed = activeView === 'map' || activeView === 'coverage';
  const navHighlightView =
    activeView === 'support-compose' || activeView === 'support-report'
      ? 'support'
      : accountPending && !['home', 'profile', 'support', 'support-compose', 'support-report', 'guide'].includes(activeView)
        ? 'home'
        : activeView;

  const moreFooter = onOpenLegal ? (
    <LegalFooterLinks onOpenLegal={onOpenLegal} className="justify-center" />
  ) : undefined;

  const overflowNav = OVERFLOW_NAV.map((item) =>
    item.id === 'messages' && messagesBadge > 0 ? { ...item, badge: messagesBadge } : item
  );

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
      overflowNavItems={overflowNav}
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
