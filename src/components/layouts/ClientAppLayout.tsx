import React, { useMemo } from 'react';
import { SessionUser } from '../../types';
import { ClientView } from '../ClientDashboard';
import { RoleAppShell } from './RoleAppShell';
import { SidebarFooterLinks } from './SidebarFooterLinks';
import type { LegalPageId } from '../../lib/legalContent';
import { EMPTY_MESSAGES_CHROME, type MessagesChrome } from '../../lib/messagesChrome';
import type { AccountMenuNotificationProps } from './AccountMenu';
import type { ThemeMode } from '../../lib/platform/theme';
import { UberDirectContextSelect } from '../baseui/layout/UberDirectContextSelect';
import {
  MessagesSquare,
  Home,
  Map,
  ClipboardList,
  Users,
  BookOpen,
  MapPin,
  FileText,
  Settings,
  Receipt,
  Plus,
  LifeBuoy,
} from 'lucide-react';

export type ClientRequestsJobTab = 'open' | 'scheduled' | 'completed' | 'missed';

type ClientNavId = ClientView | 'requests-today' | 'requests-future' | 'requests-past';

interface ClientAppLayoutProps {
  children: React.ReactNode;
  currentUser: SessionUser;
  companyName?: string;
  onSignOut: () => void;
  activeView?: ClientView;
  requestsJobTab?: ClientRequestsJobTab;
  onRequestsJobTabChange?: (tab: ClientRequestsJobTab) => void;
  onNavigate?: (view: ClientView) => void;
  accountPending?: boolean;
  onOpenLegal?: (page: LegalPageId) => void;
  onOpenDownload?: () => void;
  messagesBadge?: number;
  supportBadge?: number;
  hideHeader?: boolean;
  headerRight?: React.ReactNode;
  messagesChrome?: MessagesChrome;
  invoicesBadge?: number;
  accountNotifications?: AccountMenuNotificationProps;
  themeMode?: ThemeMode;
  onChangeTheme?: (mode: ThemeMode) => void;
}

const OVERFLOW_NAV: { id: ClientView; label: string; icon: typeof Home }[] = [
  { id: 'invoices', label: 'Payments', icon: Receipt },
  { id: 'guards', label: 'Users', icon: Users },
  { id: 'locations', label: 'Locations', icon: MapPin },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const SIDEBAR_VIEWS = new Set<ClientView>(['locations', 'reports', 'invoices', 'settings', 'guards']);

const VIEW_TITLES: Partial<Record<ClientView, string>> = {
  map: 'Map',
  home: 'Home',
  guards: 'Users',
  requests: "Today's jobs",
  'support-compose': 'Contact support',
  'support-report': 'File a report',
  locations: 'Locations',
  profile: 'Profile',
  settings: 'Account settings',
  request: 'Post job offer',
  'direct-request': 'Request guard',
  reports: 'Reports',
  invoices: 'Payments',
  guide: 'Guide',
  messages: 'Messages',
  support: 'Support',
};

function requestsTabTitle(tab: ClientRequestsJobTab): string {
  if (tab === 'scheduled') return 'Future jobs';
  if (tab === 'completed' || tab === 'missed') return 'Past jobs';
  return "Today's jobs";
}

function requestsSubNavId(tab: ClientRequestsJobTab): ClientNavId {
  if (tab === 'scheduled') return 'requests-future';
  if (tab === 'completed' || tab === 'missed') return 'requests-past';
  return 'requests-today';
}

function tabFromSubNavId(id: ClientNavId): ClientRequestsJobTab {
  if (id === 'requests-future') return 'scheduled';
  if (id === 'requests-past') return 'completed';
  return 'open';
}

export function ClientAppLayout({
  children,
  currentUser,
  companyName = 'Your company',
  onSignOut,
  activeView = 'home',
  requestsJobTab = 'open',
  onRequestsJobTabChange,
  onNavigate,
  accountPending = false,
  onOpenLegal,
  onOpenDownload,
  messagesBadge = 0,
  supportBadge = 0,
  invoicesBadge = 0,
  hideHeader = false,
  headerRight,
  messagesChrome = EMPTY_MESSAGES_CHROME,
  accountNotifications,
  themeMode,
  onChangeTheme,
}: ClientAppLayoutProps) {
  const screenTitle =
    activeView === 'home'
      ? `Welcome, ${companyName}`
      : activeView === 'requests'
        ? requestsTabTitle(requestsJobTab)
        : VIEW_TITLES[activeView] ?? 'Client dashboard';

  const fullBleed = activeView === 'map';
  const messagesViews: ClientView[] = ['messages', 'support', 'support-compose', 'support-report'];

  const navHighlightView: ClientNavId = SIDEBAR_VIEWS.has(activeView)
    ? activeView
    : activeView === 'messages' || activeView === 'support'
      ? activeView
      : messagesViews.includes(activeView)
        ? 'messages'
      : activeView === 'requests'
        ? requestsSubNavId(requestsJobTab)
        : accountPending && !['home', 'profile', 'settings', 'guide', ...messagesViews].includes(activeView)
          ? 'home'
          : activeView;

  const navItems = useMemo(
    () => [
      { id: 'home', label: 'Home', icon: Home },
      {
        id: 'requests',
        label: 'Jobs',
        icon: ClipboardList,
        children: [
          { id: 'requests-today', label: 'Today' },
          { id: 'requests-future', label: 'Future' },
          { id: 'requests-past', label: 'Past' },
        ],
      },
      { id: 'map', label: 'Map', icon: Map },
    ],
    [],
  );

  const messagesNavItems = useMemo(
    () => [
      {
        id: 'messages',
        label: 'Messages',
        icon: MessagesSquare,
        badge: messagesBadge > 0 ? messagesBadge : undefined,
      },
      {
        id: 'support',
        label: 'Support',
        icon: LifeBuoy,
        badge: supportBadge > 0 ? supportBadge : undefined,
      },
    ],
    [messagesBadge, supportBadge],
  );

  const overflowNavItems = useMemo(
    () =>
      OVERFLOW_NAV.map((item) =>
        item.id === 'invoices' && invoicesBadge > 0 ? { ...item, badge: invoicesBadge } : item,
      ),
    [invoicesBadge],
  );

  const sidebarFooter = (
    <SidebarFooterLinks
      onOpenSettings={() => onNavigate?.('settings')}
      onOpenLegal={onOpenLegal}
    />
  );

  const chromeActive = activeView === 'messages' || activeView === 'support';
  const shellHeaderOverride = chromeActive ? messagesChrome.override : null;
  const shellHeaderExtension = chromeActive ? messagesChrome.extension : null;
  const shellHideHeader = hideHeader && !shellHeaderOverride;

  const handleNavigate = (id: string) => {
    if (id === 'requests-today' || id === 'requests-future' || id === 'requests-past' || id === 'requests') {
      const tab = tabFromSubNavId(id as ClientNavId);
      onRequestsJobTabChange?.(tab);
      onNavigate?.('requests');
      return;
    }
    onNavigate?.(id as ClientView);
  };

  const headerContext = (
    <UberDirectContextSelect
      value={companyName}
      options={[{ id: companyName, label: companyName }]}
      aria-label="Organization"
    />
  );

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
        onOpenDownload,
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
        footer: undefined,
        ...accountNotifications,
        themeMode,
        onChangeTheme,
      }}
      navItems={navItems}
      messagesNavItems={messagesNavItems}
      overflowNavItems={accountPending ? [] : overflowNavItems}
      activeNavId={navHighlightView}
      onNavigate={handleNavigate}
      fullBleed={fullBleed}
      hideHeader={shellHideHeader}
      variant={activeView === 'map' ? 'dark' : 'default'}
      workspaceLabel="Client workspace"
      headerContext={headerContext}
      sidebarPrimaryAction={
        !accountPending
          ? {
              label: '+ Post a job',
              icon: <Plus size={16} strokeWidth={2.5} aria-hidden />,
              onClick: () => onNavigate?.('request'),
            }
          : undefined
      }
      sidebarFooter={sidebarFooter}
    >
      {children}
    </RoleAppShell>
  );
}
