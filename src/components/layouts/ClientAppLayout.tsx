import React, { useMemo } from 'react';
import { SessionUser } from '../../types';
import { ClientView } from '../ClientDashboard';
import { RoleAppShell } from './RoleAppShell';
import { LegalFooterLinks } from '../legal/LegalFooterLinks';
import type { LegalPageId } from '../../lib/legalContent';
import { MessagesSquare, Home, Map, ClipboardList, Users, BookOpen } from 'lucide-react';

interface ClientAppLayoutProps {
  children: React.ReactNode;
  currentUser: SessionUser;
  onSignOut: () => void;
  activeView?: ClientView;
  onNavigate?: (view: ClientView) => void;
  accountPending?: boolean;
  onOpenLegal?: (page: LegalPageId) => void;
  messagesBadge?: number;
  hideHeader?: boolean;
}

const PRIMARY_NAV: { id: ClientView; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'guards', label: 'Guards', icon: Users },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'requests', label: 'Jobs', icon: ClipboardList },
  { id: 'messages', label: 'Messages', icon: MessagesSquare },
];

const VIEW_TITLES: Partial<Record<ClientView, string>> = {
  map: 'Map',
  home: 'Home',
  guards: 'Guards',
  requests: 'Jobs',
  'support-compose': 'Contact support',
  'support-report': 'File a report',
  profile: 'Profile',
  settings: 'Settings',
  request: 'Post job offer',
  'direct-request': 'Request guard',
  reports: 'Reports',
  guide: 'General guide',
  messages: 'Messages',
  support: 'Messages',
};

export function ClientAppLayout({
  children,
  currentUser,
  onSignOut,
  activeView = 'map',
  onNavigate,
  accountPending = false,
  onOpenLegal,
  messagesBadge = 0,
  hideHeader = false,
}: ClientAppLayoutProps) {
  const clientLabel = currentUser.clientName || currentUser.name;
  const screenTitle = VIEW_TITLES[activeView] ?? 'Client dashboard';
  const fullBleed = activeView === 'map';
  const messagesViews: ClientView[] = ['messages', 'support', 'support-compose', 'support-report'];
  const navHighlightView = messagesViews.includes(activeView)
    ? 'messages'
    : accountPending && !['home', 'profile', 'settings', 'guide', ...messagesViews].includes(activeView)
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
        onOpenProfile: () => onNavigate?.('profile'),
        onOpenSettings: () => onNavigate?.('settings'),
        onSignOut,
        active: activeView === 'profile' || activeView === 'settings',
        extraLinks: [
          {
            label: 'General guide',
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
