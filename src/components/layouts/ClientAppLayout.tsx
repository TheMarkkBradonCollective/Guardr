import React, { useMemo } from 'react';
import { SessionUser } from '../../types';
import { ClientView } from '../ClientDashboard';
import { RoleAppShell } from './RoleAppShell';
import { SidebarFooterLinks } from './SidebarFooterLinks';
import type { LegalPageId } from '../../lib/legalContent';
import { EMPTY_MESSAGES_CHROME, type MessagesChrome } from '../../lib/messagesChrome';
import type { AccountMenuNotificationProps } from './AccountMenu';
import type { ThemeMode } from '../../lib/platform/theme';
import { DirectContextSelect } from '../baseui/layout/DirectContextSelect';
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
  LifeBuoy,
  UsersRound,
  Radio,
} from 'lucide-react';
import { useClientCapabilities } from '../client/ClientCapabilitiesContext';
import type { ClientOverflowNavId } from '../../lib/clientCapabilities';

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

const OVERFLOW_NAV_ICONS: Record<ClientOverflowNavId, typeof Home> = {
  invoices: Receipt,
  guards: Users,
  locations: MapPin,
  reports: FileText,
  roster: UsersRound,
  operations: Radio,
  settings: Settings,
};

const SIDEBAR_VIEWS = new Set<ClientView>([
  'locations',
  'reports',
  'invoices',
  'settings',
  'guards',
  'roster',
  'operations',
]);

const VIEW_TITLES: Partial<Record<ClientView, string>> = {
  map: 'Map',
  home: 'Home',
  guards: 'Guards',
  requests: "Today's jobs",
  'support-compose': 'Contact support',
  'support-report': 'File a report',
  locations: 'Locations',
  profile: 'Profile',
  settings: 'Account settings',
  request: 'Post job offer',
  'direct-request': 'Request guard',
  reports: 'Reports',
  roster: 'Company roster',
  operations: 'Live operations',
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
  const caps = useClientCapabilities();
  const screenTitle =
    activeView === 'home'
      ? `Welcome, ${companyName}`
      : activeView === 'requests'
        ? requestsTabTitle(requestsJobTab)
        : activeView === 'locations'
          ? caps.isPersonal
            ? 'Locations'
            : 'Sites'
          : activeView === 'invoices'
            ? caps.isPersonal
              ? 'Payments'
              : 'Billing'
            : activeView === 'request'
              ? caps.isPersonal
                ? 'Request security'
                : 'Post job offer'
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

  const navItems = useMemo(() => {
    const ICONS: Record<string, typeof Home> = {
      home: Home,
      requests: ClipboardList,
      map: Map,
      operations: Radio,
      roster: UsersRound,
    };
    return caps.primaryNav.map((item) => {
      if (item.id === 'requests') {
        return {
          id: 'requests',
          label: item.label,
          icon: ClipboardList,
          children: [
            { id: 'requests-today', label: 'Today' },
            { id: 'requests-future', label: 'Future' },
            { id: 'requests-past', label: 'Past' },
          ],
        };
      }
      return { id: item.id, label: item.label, icon: ICONS[item.id] ?? Home };
    });
  }, [caps.primaryNav]);

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
      caps.overflowNav.map((item) => ({
        id: item.id,
        label: item.label,
        icon: OVERFLOW_NAV_ICONS[item.id],
        badge: item.id === 'invoices' && invoicesBadge > 0 ? invoicesBadge : undefined,
      })),
    [caps.overflowNav, invoicesBadge],
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
    <DirectContextSelect
      value={companyName}
      options={[{ id: companyName, label: companyName }]}
      aria-label={caps.isPersonal ? 'Account' : 'Organization'}
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
      workspaceLabel="Hire"
      productApp="client"
      mobilePrimaryNav="tabs"
      mobileTabRanks={{ home: 1, requests: 2, map: 3, operations: 3, messages: 4 }}
      headerContext={headerContext}
      sidebarFooter={sidebarFooter}
    >
      {children}
    </RoleAppShell>
  );
}
