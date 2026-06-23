import type { ClientView } from '../components/ClientDashboard';
import type { GuardTab } from '../components/GuardDashboard';
import type { LegalPageId } from './legalContent';
import { normalizeStaffSection, resolveStaffSection, staffSectionFromMessageTab, type ApprovalQueueId, type StaffSection } from './staffOps';

export type AppRole = 'staff' | 'guard' | 'client';

export type AuthViewMode = 'sign-in' | 'sign-up';
export type AuthViewRole = 'guard' | 'client';

export interface AppRoute {
  role: AppRole;
  staffSection?: StaffSection;
  guardTab?: GuardTab;
  clientView?: ClientView;
  guardId?: string;
  /** Staff guards panel — selected guard profile */
  staffGuardId?: string;
  /** Staff clients panel — selected client */
  staffClientId?: string;
  /** Staff jobs panel — selected job */
  staffJobId?: string;
  /** Staff team panel — selected staff member */
  staffTeamId?: string;
  /** Staff guard profile edit mode */
  staffEdit?: boolean;
  /** Client guards directory — viewing a guard profile */
  clientGuardId?: string;
  /** Client direct-request flow — target guard */
  clientDirectGuardId?: string;
  /** Job chat thread — opens the conversation directly */
  jobChatRequestId?: string;
  /** Support ticket — opens the thread directly */
  supportTicketId?: string;
  /** Support inbox tab when on support home */
  supportSection?: 'support' | 'reports';
  /** Guard support tab — dedicated form page */
  supportMode?: 'compose' | 'report';
  /** Staff messages hub tab */
  staffMessageTab?: 'team' | 'jobs';
  /** Staff approvals queue — opens a specific review list */
  staffApprovalQueue?: ApprovalQueueId;
  /** Open job chat UI immediately (guard/client) */
  openJobChat?: boolean;
  /** Unauthenticated auth screen */
  authView?: AuthViewMode;
  authRole?: AuthViewRole;
}

const GUARD_TAB_FROM_SLUG: Record<string, GuardTab> = {
  map: 'map',
  'my-jobs': 'myJobs',
  jobs: 'myJobs',
  earnings: 'earnings',
  pay: 'earnings',
  'guard-chat': 'guardChat',
  support: 'support',
  profile: 'profile',
  guide: 'guide',
};

const GUARD_TAB_TO_SLUG: Record<GuardTab, string> = {
  map: 'map',
  myJobs: 'my-jobs',
  earnings: 'earnings',
  guardChat: 'guard-chat',
  support: 'support',
  profile: 'profile',
  guide: 'guide',
};

const CLIENT_VIEW_FROM_SLUG: Record<string, ClientView> = {
  home: 'home',
  profile: 'profile',
  support: 'support',
  'support-compose': 'support-compose',
  'support-report': 'support-report',
  map: 'map',
  request: 'request',
  'direct-request': 'direct-request',
  coverage: 'coverage',
  reports: 'reports',
  requests: 'requests',
  guards: 'guards',
  guide: 'guide',
};

const CLIENT_VIEW_TO_SLUG: Partial<Record<ClientView, string>> = {
  home: 'home',
  profile: 'profile',
  support: 'support',
  'support-compose': 'support-compose',
  'support-report': 'support-report',
  map: 'map',
  request: 'request',
  'direct-request': 'direct-request',
  coverage: 'coverage',
  reports: 'reports',
  requests: 'requests',
  guards: 'guards',
  guide: 'guide',
};

function parsePath(url: string): { pathname: string; searchParams: URLSearchParams } {
  try {
    const parsed = new URL(url, window.location.origin);
    return {
      pathname: parsed.pathname.replace(/\/$/, '') || '/',
      searchParams: parsed.searchParams,
    };
  } catch {
    return { pathname: '/', searchParams: new URLSearchParams() };
  }
}

function parseNestedRoute(searchParams: URLSearchParams): Partial<AppRoute> {
  const nested: Partial<AppRoute> = {};
  const staffGuardId = searchParams.get('g');
  const staffClientId = searchParams.get('c');
  const staffJobId = searchParams.get('j');
  const staffTeamId = searchParams.get('t');
  const staffEdit = searchParams.get('edit');
  const clientGuardId = searchParams.get('pg');
  const clientDirectGuardId = searchParams.get('dr');
  const jobChatRequestId = searchParams.get('jc');
  const supportTicketId = searchParams.get('st');
  const supportSection = searchParams.get('sec');
  const supportMode = searchParams.get('sm');
  const staffMessageTab = searchParams.get('mtab');
  const staffApprovalQueue = searchParams.get('aq');
  const openJobChat = searchParams.get('chat');
  const authView = searchParams.get('auth');
  const authRole = searchParams.get('ar');

  if (staffGuardId) nested.staffGuardId = staffGuardId;
  if (staffClientId) nested.staffClientId = staffClientId;
  if (staffJobId) nested.staffJobId = staffJobId;
  if (staffTeamId) nested.staffTeamId = staffTeamId;
  if (staffEdit === '1' || staffEdit === 'true') nested.staffEdit = true;
  if (clientGuardId) nested.clientGuardId = clientGuardId;
  if (clientDirectGuardId) nested.clientDirectGuardId = clientDirectGuardId;
  if (jobChatRequestId) nested.jobChatRequestId = jobChatRequestId;
  if (supportTicketId) nested.supportTicketId = supportTicketId;
  if (supportSection === 'support' || supportSection === 'reports') nested.supportSection = supportSection;
  if (supportMode === 'compose' || supportMode === 'report') nested.supportMode = supportMode;
  if (staffMessageTab === 'team' || staffMessageTab === 'jobs') nested.staffMessageTab = staffMessageTab;
  if (
    staffApprovalQueue === 'accounts' ||
    staffApprovalQueue === 'job-offers' ||
    staffApprovalQueue === 'applications' ||
    staffApprovalQueue === 'credentials'
  ) {
    nested.staffApprovalQueue = staffApprovalQueue;
  }
  if (openJobChat === '1' || openJobChat === 'true') nested.openJobChat = true;
  if (authView === 'sign-in' || authView === 'sign-up') nested.authView = authView;
  if (authRole === 'guard' || authRole === 'client') nested.authRole = authRole;

  return nested;
}

function buildNestedQuery(route: AppRoute): URLSearchParams {
  const params = new URLSearchParams();
  if (route.staffGuardId) params.set('g', route.staffGuardId);
  if (route.staffClientId) params.set('c', route.staffClientId);
  if (route.staffJobId) params.set('j', route.staffJobId);
  if (route.staffTeamId) params.set('t', route.staffTeamId);
  if (route.staffEdit) params.set('edit', '1');
  if (route.clientGuardId) params.set('pg', route.clientGuardId);
  if (route.clientDirectGuardId) params.set('dr', route.clientDirectGuardId);
  if (route.jobChatRequestId) params.set('jc', route.jobChatRequestId);
  if (route.supportTicketId) params.set('st', route.supportTicketId);
  if (route.supportSection) params.set('sec', route.supportSection);
  if (route.supportMode) params.set('sm', route.supportMode);
  if (route.staffMessageTab) params.set('mtab', route.staffMessageTab);
  if (route.staffApprovalQueue) params.set('aq', route.staffApprovalQueue);
  if (route.openJobChat) params.set('chat', '1');
  if (route.authView) params.set('auth', route.authView);
  if (route.authRole) params.set('ar', route.authRole);
  return params;
}

/** Read the in-app destination from the current URL (path + query + legacy push links). */
export function parseAppRoute(url: string): AppRoute | null {
  const { pathname, searchParams } = parsePath(url);
  const nested = parseNestedRoute(searchParams);

  if (pathname === '/legal/terms' || pathname === '/legal/privacy') {
    return null;
  }

  if (pathname === '/' || pathname === '') {
    if (nested.authView) {
      return { role: 'client', ...nested };
    }
    return null;
  }

  if (pathname === '/dispatch') {
    return { role: 'staff', staffSection: 'jobs', ...nested };
  }

  if (pathname === '/staff/messages') {
    const section = staffSectionFromMessageTab(nested.staffMessageTab ?? null);
    return { role: 'staff', staffSection: section, ...nested, staffMessageTab: undefined };
  }

  const staffMatch = pathname.match(/^\/staff\/([^/]+)$/);
  if (staffMatch) {
    const section = resolveStaffSection(
      normalizeStaffSection(staffMatch[1]) ?? (staffMatch[1] === 'messages' ? 'messages' : undefined),
      nested.staffMessageTab ?? null
    );
    if (section) return { role: 'staff', staffSection: section, ...nested, staffMessageTab: undefined };
  }

  if (pathname === '/guard') {
    return { role: 'guard', guardTab: 'map', ...nested };
  }

  const guardWithIdMatch = pathname.match(/^\/guard\/([^/]+)$/);
  if (guardWithIdMatch) {
    const slug = guardWithIdMatch[1];
    const tab = GUARD_TAB_FROM_SLUG[slug];
    if (tab) return { role: 'guard', guardTab: tab, ...nested };
    return { role: 'guard', guardTab: 'map', guardId: slug, ...nested };
  }

  const clientMatch = pathname.match(/^\/client\/([^/]+)$/);
  if (clientMatch) {
    const view = CLIENT_VIEW_FROM_SLUG[clientMatch[1]];
    if (view) return { role: 'client', clientView: view, ...nested };
  }

  return null;
}

export function readLegalPageFromWindow(): LegalPageId | null {
  const pathname = window.location.pathname.replace(/\/$/, '') || '/';
  if (pathname === '/legal/terms') return 'terms';
  if (pathname === '/legal/privacy') return 'privacy';
  return null;
}

export function buildLegalPath(page: LegalPageId): string {
  return `/legal/${page}`;
}

export function syncLegalPage(page: LegalPageId | null, replace = false): void {
  const nextPath = page ? buildLegalPath(page) : '/';
  const current = window.location.pathname.replace(/\/$/, '') || '/';
  if (current === nextPath) return;

  const state = { legalPage: page };
  if (replace) {
    window.history.replaceState(state, '', nextPath);
  } else {
    window.history.pushState(state, '', nextPath);
  }
}

export function buildAppPath(route: AppRoute): string {
  if (route.authView) {
    const params = buildNestedQuery(route);
    const qs = params.toString();
    return qs ? `/?${qs}` : '/';
  }

  let base: string;
  switch (route.role) {
    case 'staff':
      base = `/staff/${route.staffSection ?? 'overview'}`;
      break;
    case 'guard':
      base = `/guard/${GUARD_TAB_TO_SLUG[route.guardTab ?? 'map']}`;
      break;
    case 'client':
      base = `/client/${CLIENT_VIEW_TO_SLUG[route.clientView ?? 'home'] ?? 'home'}`;
      break;
    default:
      base = '/';
  }

  const params = buildNestedQuery(route);
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export function readAppRouteFromWindow(): AppRoute | null {
  return parseAppRoute(window.location.pathname + window.location.search);
}

function currentBrowserPath(): string {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  return path + window.location.search;
}

export function syncAppRoute(route: AppRoute, replace = false): void {
  const nextPath = buildAppPath(route);
  if (currentBrowserPath() === nextPath) return;

  const state = { appRoute: route };
  if (replace) {
    window.history.replaceState(state, '', nextPath);
  } else {
    window.history.pushState(state, '', nextPath);
  }
}

export function defaultRouteForRole(role: AppRoute['role']): AppRoute {
  switch (role) {
    case 'staff':
      return { role: 'staff', staffSection: 'overview' };
    case 'guard':
      return { role: 'guard', guardTab: 'map' };
    case 'client':
      return { role: 'client', clientView: 'home' };
  }
}

/** Clear nested selection params while keeping the top-level section/view. */
export function routeWithoutNestedSelection(route: AppRoute): AppRoute {
  return {
    ...route,
    staffGuardId: undefined,
    staffClientId: undefined,
    staffJobId: undefined,
    staffTeamId: undefined,
    staffEdit: undefined,
    clientGuardId: undefined,
    clientDirectGuardId: undefined,
    jobChatRequestId: undefined,
    supportTicketId: undefined,
    supportSection: undefined,
    supportMode: undefined,
    staffMessageTab: undefined,
    staffApprovalQueue: undefined,
    openJobChat: undefined,
  };
}
