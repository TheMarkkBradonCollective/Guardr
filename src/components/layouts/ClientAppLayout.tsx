import React, { useMemo } from 'react';
import { SessionUser } from '../../types';
import { ClientView } from '../ClientDashboard';
import { RoleAppShell } from './RoleAppShell';
import { LegalFooterLinks } from '../legal/LegalFooterLinks';
import type { LegalPageId } from '../../lib/legalContent';
import { EMPTY_MESSAGES_CHROME, type MessagesChrome } from '../../lib/messagesChrome';
import { MessagesSquare, Home, Map, ClipboardList, Users, BookOpen, MapPin, FileText, Settings, Receipt } from 'lucide-react';

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
  headerRight?: React.ReactNode;
  messagesChrome?: MessagesChrome;
  invoicesBadge?: number;
}

const PRIMARY_NAV: { id: ClientView; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'requests', label: 'Jobs', icon: ClipboardList },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'messages', label: 'Messages', icon: MessagesSquare },
  { id: 'guards', label: 'Guards', icon: Users },
];

const OVERFLOW_NAV: { id: ClientView; label: string; icon: typeof Home }[] = [
  { id: 'invoices', label: 'Invoices', icon: Receipt },
  { id: 'locations', label: 'Locations', icon: MapPin },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const SIDEBAR_VIEWS = new Set<ClientView>(['locations', 'reports', 'invoices', 'settings']);

const VIEW_TITLES: Partial<Record<ClientView, string>> = {
  map: 'Map',
  home: 'Home',
  guards: 'Guards',
  requests: 'Jobs',
  'support-compose': 'Contact support',
  'support-report': 'File a report',
  locations: 'My Locations',
  profile: 'Profile',
  settings: 'Settings',
  request: 'Post job offer',
  'direct-request': 'Request guard',
  reports: 'Reports',
  invoices: 'Invoices',
  guide: 'Guide',
  messages: 'Messages',
  support: 'Messages',
};

export function ClientAppLayout({
  children,
  currentUser,
  onSignOut,
  activeView = 'home',
  onNavigate,
  accountPending = false,
  onOpenLegal,
  messagesBadge = 0,
  invoicesBadge = 0,
  hideHeader = false,
  headerRight,
  messagesChrome = EMPTY_MESSAGES_CHROME,
}: ClientAppLayoutProps) {
  const screenTitle = VIEW_TITLES[activeView] ?? 'Client dashboard';
  const fullBleed = activeView === 'map';
  const messagesViews: ClientView[] = ['messages', 'support', 'support-compose', 'support-report'];
  const navHighlightView = SIDEBAR_VIEWS.has(activeView)
    ? activeView
    : messagesViews.includes(activeView)
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

  const overflowNavItems = useMemo(
    () =>
      OVERFLOW_NAV.map((item) =>
        item.id === 'invoices' && invoicesBadge > 0 ? { ...item, badge: invoicesBadge } : item
      ),
    [invoicesBadge]
  );

  const accountFooter = onOpenLegal ? (
    <LegalFooterLinks onOpenLegal={onOpenLegal} className="justify-center" />
  ) : undefined;

  const chromeActive = activeView === 'messages';
  const shellHeaderOverride = chromeActive ? messagesChrome.override : null;
  const shellHeaderExtension = chromeActive ? messagesChrome.extension : null;
  const shellHideHeader = hideHeader && !shellHeaderOverride;

  return (
    <RoleAppShell
      title={screenTitle}
      notifications={headerRight}
      headerExtension={shellHeaderExtension}
      headerOverride={shellHeaderOverride}
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
            label: 'Guide',
            icon: BookOpen,
            onClick: () => onNavigate?.('guide'),
            active: activeView === 'guide',
          },
        ],
        footer: accountFooter,
      }}
      navItems={navItems}
      overflowNavItems={accountPending ? [] : overflowNavItems}
      activeNavId={navHighlightView}
      onNavigate={(id) => onNavigate?.(id as ClientView)}
      fullBleed={fullBleed}
      hideHeader={shellHideHeader}
      variant={activeView === 'map' ? 'dark' : 'default'}
      workspaceLabel="Client workspace"
    >
      {children}
    </RoleAppShell>
  );
}
