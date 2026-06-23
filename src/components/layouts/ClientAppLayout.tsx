import React, { useMemo } from 'react';
import { SessionUser } from '../../types';
import { ClientView } from '../ClientDashboard';
import { RoleAppShell } from './RoleAppShell';
import { LegalFooterLinks } from '../legal/LegalFooterLinks';
import type { LegalPageId } from '../../lib/legalContent';
import { MessagesSquare, Home, Map, ClipboardList, Users, BookOpen } from 'lucide-react';

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
  hideHeader?: boolean;
}

const PRIMARY_NAV: { id: ClientView; label: string; icon: typeof Home }[] = [
  { id: 'map', label: 'Map', icon: Map },
  { id: 'home', label: 'Home', icon: Home },
  { id: 'messages', label: 'Messages', icon: MessagesSquare },
  { id: 'guards', label: 'Guards', icon: Users },
  { id: 'requests', label: 'Jobs', icon: ClipboardList },
];

const VIEW_TITLES: Partial<Record<ClientView, string>> = {
  map: 'Map',
  home: 'Home',
  guards: 'Guards',
  coverage: 'Live coverage',
  requests: 'Jobs',
  'support-compose': 'Contact support',
  'support-report': 'File a report',
  profile: 'Profile',
  request: 'Post job offer',
  'direct-request': 'Request guard',
  reports: 'Reports',
  guide: 'Workflow guide',
  messages: 'Messages',
  support: 'Messages',
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
  hideHeader = false,
}: ClientAppLayoutProps) {
  const clientLabel = currentUser.clientName || currentUser.name;
  const screenTitle = VIEW_TITLES[activeView] ?? 'Client dashboard';
  const fullBleed = activeView === 'map' || activeView === 'coverage';
  const messagesViews: ClientView[] = ['messages', 'support', 'support-compose', 'support-report'];
  const navHighlightView = messagesViews.includes(activeView)
    ? 'messages'
    : accountPending && !['home', 'profile', 'guide', ...messagesViews].includes(activeView)
      ? 'home'
      : activeView;

  const navItems = useMemo(
    () =>
      PRIMARY_NAV.map((item) =>
        item.id === 'messages' && messagesBadge > 0 ? { ...item, badge: messagesBadge } : item
      ),
    [messagesBadge]
  );

  const accountFooter = onOpenLegal ? (
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
        extraLinks: [
          {
            label: 'Workflow guide',
            icon: BookOpen,
            onClick: () => onNavigate?.('guide'),
            active: activeView === 'guide',
          },
        ],
        footer: accountFooter,
      }}
      navItems={navItems}
      activeNavId={navHighlightView}
      onNavigate={(id) => onNavigate?.(id as ClientView)}
      fullBleed={fullBleed}
      hideHeader={hideHeader}
      variant={activeView === 'map' ? 'dark' : 'default'}
      experience="client"
    >
      {children}
    </RoleAppShell>
  );
}
