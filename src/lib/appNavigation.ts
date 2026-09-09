import type { ClientView } from '../components/ClientDashboard';
import type { GuardTab } from '../components/GuardDashboard';
import type { ClientType, SecurityGuard } from '../types';
import { isClientType } from './clientType';
import { isGuardAccountApproved, isGuardUserStatusActive } from './accountStatus';
import type { GuardJobsBrowseTab } from './guardJobsBrowse';
import type { PerformanceFactorId } from './guardPerformanceFactorDetail';
import { isPerformanceFactorId } from './guardPerformanceFactorDetail';
import type { LegalPageId } from './legalContent';
import { normalizeStaffSection, resolveStaffSection, staffSectionFromMessageTab, type ApprovalQueueId, type StaffSection } from './staffOps';
import {
  buildWebsiteAccountPath,
  isWebsiteAccountView,
  parseWebsiteAccountView,
  type WebsiteAccountView,
} from './productApps';

export type { WebsiteAccountView } from './productApps';

export type ClientJobsTab = 'open' | 'scheduled' | 'completed' | 'missed';

const CLIENT_JOBS_TABS = new Set<ClientJobsTab>(['open', 'scheduled', 'completed', 'missed']);
const GUARD_JOBS_TABS = new Set<GuardJobsBrowseTab>(['available', 'scheduled', 'completed', 'missed']);

function parseClientJobsTab(value: string | null): ClientJobsTab | undefined {
  if (value && CLIENT_JOBS_TABS.has(value as ClientJobsTab)) return value as ClientJobsTab;
  return undefined;
}

function parseGuardJobsTab(value: string | null): GuardJobsBrowseTab | undefined {
  if (value && GUARD_JOBS_TABS.has(value as GuardJobsBrowseTab)) return value as GuardJobsBrowseTab;
  return undefined;
}

export type AppRole = 'staff' | 'guard' | 'client';

export type AuthViewMode = 'sign-in' | 'sign-up';
export type AuthViewRole = 'guard' | 'client' | 'staff';
/** Sign-up selection screens: path → client kind or work role. */
export type AuthSignupPick = 'path' | 'client' | 'work';

const AUTH_CHOICE_PICKS = new Set(['role', 'path', 'client', 'work']);
const AUTH_SIGNUP_PICKS = new Set<AuthSignupPick>(['path', 'client', 'work']);

export type StaffGuardDetailTab = 'profile' | 'certs' | 'inventory' | 'performance' | 'timesheet';

export type GuardProfileTab = 'profile' | 'certs' | 'inventory' | 'timesheet';

export type StaffProfileTab = 'profile' | 'timesheets';

export type StaffTeamDetailTab = 'profile' | 'timesheets';

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
  /** Staff credentials tab — selected credential feed item */
  staffCredentialItemId?: string;
  /** Staff guard profile edit mode */
  staffEdit?: boolean;
  /** Staff guard detail tab */
  staffGuardTab?: StaffGuardDetailTab;
  /** Guard or staff performance factor drill-down */
  performanceFactorId?: PerformanceFactorId;
  /** Client guards directory — viewing a guard profile */
  clientGuardId?: string;
  /** Client direct-request flow — target guard */
  clientDirectGuardId?: string;
  /** Job chat thread — opens the conversation directly */
  jobChatRequestId?: string;
  /** Team / crew chat thread (guard + staff) */
  teamChatRequestId?: string;
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
  /** Client invoices — selected job invoice */
  clientInvoiceRequestId?: string;
  /** Client jobs list — filter tab */
  clientJobsTab?: ClientJobsTab;
  /** Client jobs list — selected request detail */
  clientJobId?: string;
  /** Guard jobs list / map browse — filter tab */
  guardJobsTab?: GuardJobsBrowseTab;
  /** Guard jobs list — selected job detail */
  guardJobId?: string;
  /** Unauthenticated auth screen */
  authView?: AuthViewMode;
  authRole?: AuthViewRole;
  /** Client sign-up — personal vs business contracting party. */
  authClientType?: ClientType;
  /**
   * Website account portal — billing, profile, settings, support.
   * Operational work still lives in the dedicated role app.
   */
  websiteAccount?: boolean;
  accountView?: WebsiteAccountView;
}

const GUARD_TAB_FROM_SLUG: Record<string, GuardTab> = {
  map: 'map',
  activation: 'activation',
  'my-jobs': 'myJobs',
  jobs: 'myJobs',
  earnings: 'earnings',
  pay: 'earnings',
  payments: 'earnings',
  'guard-chat': 'messages',
  messages: 'messages',
  support: 'support',
  profile: 'profile',
  settings: 'settings',
  guide: 'guide',
  preferences: 'preferences',
  performance: 'performance',
  availability: 'availability',
  vehicle: 'vehicle',
};

const GUARD_TAB_TO_SLUG: Record<GuardTab, string> = {
  map: 'map',
  activation: 'activation',
  myJobs: 'my-jobs',
  earnings: 'payments',
  guardChat: 'messages',
  messages: 'messages',
  support: 'support',
  profile: 'profile',
  settings: 'settings',
  guide: 'guide',
  preferences: 'preferences',
  performance: 'performance',
  availability: 'availability',
  vehicle: 'vehicle',
};

/** Guards need active account status before non-activation tabs unlock. */
function isGuardNavUnlocked(
  guard: Pick<SecurityGuard, 'userStatus' | 'isStaff'> & Partial<SecurityGuard>
): boolean {
  if (guard.isStaff) return true;
  return isGuardUserStatusActive(guard);
}

/** Inactive guards may only use settings; all other tabs route to activation. */
export function normalizeGuardTabForAccount(
  tab: GuardTab | undefined,
  guard: Pick<SecurityGuard, 'userStatus' | 'isStaff'> & Partial<SecurityGuard> | null | undefined
): GuardTab {
  const resolved: GuardTab =
    tab === 'guardChat' ? 'messages' : tab ?? 'activation';
  if (!guard) {
    if (resolved === 'settings') return 'settings';
    return 'activation';
  }
  if (isGuardNavUnlocked(guard)) {
    return resolved === 'activation' ? 'map' : resolved;
  }
  if (resolved === 'settings') return 'settings';
  if (resolved === 'support' && isGuardAccountApproved(guard)) return 'support';
  return 'activation';
}

const CLIENT_VIEW_FROM_SLUG: Record<string, ClientView> = {
  home: 'home',
  profile: 'profile',
  settings: 'settings',
  support: 'support',
  'support-compose': 'support-compose',
  'support-report': 'support-report',
  map: 'map',
  request: 'request',
  'direct-request': 'direct-request',
  coverage: 'map',
  messages: 'messages',
  reports: 'reports',
  invoices: 'invoices',
  payments: 'invoices',
  billing: 'invoices',
  requests: 'requests',
  guards: 'guards',
  locations: 'locations',
  roster: 'roster',
  operations: 'operations',
  guide: 'guide',
};

const CLIENT_VIEW_TO_SLUG: Partial<Record<ClientView, string>> = {
  home: 'home',
  profile: 'profile',
  settings: 'settings',
  support: 'support',
  'support-compose': 'support-compose',
  'support-report': 'support-report',
  map: 'map',
  request: 'request',
  'direct-request': 'direct-request',
  messages: 'messages',
  reports: 'reports',
  invoices: 'payments',
  requests: 'requests',
  guards: 'guards',
  locations: 'locations',
  roster: 'roster',
  operations: 'operations',
  guide: 'guide',
};

function parsePath(url: string): { pathname: string; searchParams: URLSearchParams } {
  try {
    const base =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const parsed = new URL(url, base);
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
  const staffCredentialItemId = searchParams.get('ci');
  const staffEdit = searchParams.get('edit');
  const staffGuardTab = searchParams.get('gtab');
  const performanceFactor = searchParams.get('pf');
  const clientGuardId = searchParams.get('pg');
  const clientDirectGuardId = searchParams.get('dr');
  const jobChatRequestId = searchParams.get('jc');
  const teamChatRequestId = searchParams.get('tc');
  const supportTicketId = searchParams.get('st');
  const supportSection = searchParams.get('sec');
  const supportMode = searchParams.get('sm');
  const staffMessageTab = searchParams.get('mtab');
  const staffApprovalQueue = searchParams.get('aq');
  const openJobChat = searchParams.get('chat');
  const clientInvoiceRequestId = searchParams.get('inv');
  const clientJobsTab = parseClientJobsTab(searchParams.get('jt'));
  const clientJobId = searchParams.get('cj');
  const guardJobsTab = parseGuardJobsTab(searchParams.get('bt'));
  const guardJobId = searchParams.get('gj');
  const authView = searchParams.get('auth');
  const authRole = searchParams.get('ar');
  const authClientType = searchParams.get('ct') ?? searchParams.get('ck');

  if (staffGuardId) nested.staffGuardId = staffGuardId;
  if (staffClientId) nested.staffClientId = staffClientId;
  if (staffJobId) nested.staffJobId = staffJobId;
  if (staffCredentialItemId) nested.staffCredentialItemId = staffCredentialItemId;
  if (staffTeamId) nested.staffTeamId = staffTeamId;
  if (staffEdit === '1' || staffEdit === 'true') nested.staffEdit = true;
  if (
    staffGuardTab === 'profile' ||
    staffGuardTab === 'certs' ||
    staffGuardTab === 'inventory' ||
    staffGuardTab === 'performance' ||
    staffGuardTab === 'timesheet'
  ) {
    nested.staffGuardTab = staffGuardTab;
  }
  if (performanceFactor && isPerformanceFactorId(performanceFactor)) {
    nested.performanceFactorId = performanceFactor;
  }
  if (clientGuardId) nested.clientGuardId = clientGuardId;
  if (clientDirectGuardId) nested.clientDirectGuardId = clientDirectGuardId;
  if (teamChatRequestId) nested.teamChatRequestId = teamChatRequestId;
  if (jobChatRequestId) {
    if (staffMessageTab === 'team') {
      nested.teamChatRequestId = jobChatRequestId;
    } else {
      nested.jobChatRequestId = jobChatRequestId;
    }
  }
  if (supportTicketId) nested.supportTicketId = supportTicketId;
  if (supportSection === 'support' || supportSection === 'reports') nested.supportSection = supportSection;
  if (supportMode === 'compose' || supportMode === 'report') nested.supportMode = supportMode;
  if (staffMessageTab === 'team' || staffMessageTab === 'jobs') nested.staffMessageTab = staffMessageTab;
  if (
    staffApprovalQueue === 'all' ||
    staffApprovalQueue === 'accounts' ||
    staffApprovalQueue === 'guard-accounts' ||
    staffApprovalQueue === 'staff-accounts' ||
    staffApprovalQueue === 'client-accounts' ||
    staffApprovalQueue === 'job-offers' ||
    staffApprovalQueue === 'schedule-changes' ||
    staffApprovalQueue === 'applications' ||
    staffApprovalQueue === 'credentials'
  ) {
    nested.staffApprovalQueue = staffApprovalQueue;
  }
  if (openJobChat === '1' || openJobChat === 'true') nested.openJobChat = true;
  if (clientInvoiceRequestId) nested.clientInvoiceRequestId = clientInvoiceRequestId;
  if (clientJobsTab) nested.clientJobsTab = clientJobsTab;
  if (clientJobId) nested.clientJobId = clientJobId;
  if (guardJobsTab) nested.guardJobsTab = guardJobsTab;
  if (guardJobId) nested.guardJobId = guardJobId;
  const isAuthChoice = AUTH_CHOICE_PICKS.has(searchParams.get('pick') ?? '');
  if (!isAuthChoice && (authView === 'sign-in' || authView === 'sign-up')) nested.authView = authView;
  if (authRole === 'guard' || authRole === 'client' || authRole === 'staff') nested.authRole = authRole;
  if (isClientType(authClientType)) nested.authClientType = authClientType;

  return nested;
}

function buildNestedQuery(route: AppRoute): URLSearchParams {
  const params = new URLSearchParams();
  if (route.staffGuardId) params.set('g', route.staffGuardId);
  if (route.staffClientId) params.set('c', route.staffClientId);
  if (route.staffJobId) params.set('j', route.staffJobId);
  if (route.staffCredentialItemId) params.set('ci', route.staffCredentialItemId);
  if (route.staffTeamId) params.set('t', route.staffTeamId);
  if (route.staffEdit) params.set('edit', '1');
  if (route.staffGuardTab) params.set('gtab', route.staffGuardTab);
  if (route.performanceFactorId) params.set('pf', route.performanceFactorId);
  if (route.clientGuardId) params.set('pg', route.clientGuardId);
  if (route.clientDirectGuardId) params.set('dr', route.clientDirectGuardId);
  if (route.teamChatRequestId) params.set('tc', route.teamChatRequestId);
  if (route.jobChatRequestId) params.set('jc', route.jobChatRequestId);
  if (route.supportTicketId) params.set('st', route.supportTicketId);
  if (route.supportSection) params.set('sec', route.supportSection);
  if (route.supportMode) params.set('sm', route.supportMode);
  if (route.staffMessageTab) params.set('mtab', route.staffMessageTab);
  if (route.staffApprovalQueue) params.set('aq', route.staffApprovalQueue);
  if (route.openJobChat) params.set('chat', '1');
  if (route.clientInvoiceRequestId) params.set('inv', route.clientInvoiceRequestId);
  if (route.clientJobsTab) params.set('jt', route.clientJobsTab);
  if (route.clientJobId) params.set('cj', route.clientJobId);
  if (route.guardJobsTab) params.set('bt', route.guardJobsTab);
  if (route.guardJobId) params.set('gj', route.guardJobId);
  if (route.authView) params.set('auth', route.authView);
  if (route.authRole) params.set('ar', route.authRole);
  if (route.authClientType) params.set('ct', route.authClientType);
  return params;
}

/** Read the in-app destination from the current URL (path + query + legacy push links). */
export function parseAppRoute(url: string): AppRoute | null {
  const { pathname, searchParams } = parsePath(url);
  const nested = parseNestedRoute(searchParams);

  if (pathname === '/legal/terms' || pathname === '/legal/privacy') {
    return null;
  }
  if (pathname.startsWith('/legal/')) {
    return null;
  }

  if (pathname === '/' || pathname === '') {
    if (nested.authView) {
      return { role: 'client', ...nested };
    }
    return null;
  }

  if (pathname === '/account' || pathname.startsWith('/account/')) {
    const accountView = parseWebsiteAccountView(pathname) ?? 'home';
    return { role: 'client', websiteAccount: true, accountView, ...nested };
  }

  const appAlias = pathname.match(/^\/app\/(client|guard|staff)(?:\/(.*))?$/);
  if (appAlias) {
    const restPath = appAlias[2] ? `/${appAlias[1]}/${appAlias[2]}` : `/${appAlias[1]}`;
    const qs = searchParams.toString();
    return parseAppRoute(qs ? `${restPath}?${qs}` : restPath);
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

  if (pathname === '/client') {
    return { role: 'client', clientView: 'home', ...nested };
  }

  if (pathname === '/staff') {
    return { role: 'staff', staffSection: 'overview', ...nested };
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
  return readLegalPageFromUrl(window.location.pathname);
}

export function readGuideFromUrl(url: string): boolean {
  const { pathname } = parsePath(url);
  return pathname === '/guide';
}

export function readGuideFromWindow(): boolean {
  return readGuideFromUrl(window.location.pathname);
}

export function syncGuidePage(open: boolean, replace = false): void {
  const nextPath = open ? '/guide' : '/';
  const current = window.location.pathname.replace(/\/$/, '') || '/';
  const state = { publicGuide: open };
  const pathMatches = current === nextPath;
  const hasGuideState =
    open
      ? (window.history.state as { publicGuide?: boolean } | null)?.publicGuide === true
      : (window.history.state as { publicGuide?: boolean } | null)?.publicGuide == null;

  if (pathMatches && hasGuideState) return;

  if (replace || pathMatches) {
    window.history.replaceState(state, '', nextPath);
    return;
  }

  window.history.pushState(state, '', nextPath);
}

export function readLegalPageFromUrl(url: string): LegalPageId | null {
  const { pathname } = parsePath(url);
  if (pathname === '/legal/terms') return 'terms';
  if (pathname === '/legal/privacy') return 'privacy';
  if (pathname === '/legal/ica') return 'ica';
  if (pathname === '/legal/client-agreement') return 'client-agreement';
  if (pathname === '/legal/guard-conduct') return 'guard-conduct';
  if (pathname === '/legal/equal-opportunity') return 'equal-opportunity';
  return null;
}

export function buildLegalPath(page: LegalPageId): string {
  return `/legal/${page}`;
}

export function syncLegalPage(page: LegalPageId | null, replace = false): void {
  const nextPath = page ? buildLegalPath(page) : '/';
  const current = window.location.pathname.replace(/\/$/, '') || '/';
  const state = { legalPage: page };
  const pathMatches = current === nextPath;
  const hasLegalState =
    page != null
      ? (window.history.state as { legalPage?: LegalPageId } | null)?.legalPage === page
      : (window.history.state as { legalPage?: LegalPageId } | null)?.legalPage == null;

  if (pathMatches && hasLegalState) return;

  if (replace || pathMatches) {
    window.history.replaceState(state, '', nextPath);
    return;
  }

  window.history.pushState(state, '', nextPath);
}

export function buildAppPath(route: AppRoute): string {
  if (route.authView) {
    const params = buildNestedQuery(route);
    const qs = params.toString();
    return qs ? `/?${qs}` : '/';
  }

  if (route.websiteAccount) {
    const view = isWebsiteAccountView(route.accountView) ? route.accountView : 'home';
    return buildWebsiteAccountPath(view);
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
  return parseAppRoute(stripEphemeralQueryParams(window.location.pathname + window.location.search));
}

/** Role / signup picker at `/?auth=sign-in&pick=role` or `/?auth=sign-up&pick=path`. */
export function readAuthChoiceFromUrl(url: string): AuthViewMode | null {
  const { searchParams } = parsePath(url);
  const pick = searchParams.get('pick');
  if (!AUTH_CHOICE_PICKS.has(pick ?? '')) return null;
  const auth = searchParams.get('auth');
  if (auth === 'sign-in' || auth === 'sign-up') return auth;
  return null;
}

export function readAuthSignupPickFromUrl(url: string): AuthSignupPick | null {
  const { searchParams } = parsePath(url);
  const auth = searchParams.get('auth');
  const pick = searchParams.get('pick');
  if (auth === 'sign-in' && pick === 'client') return 'client';
  if (auth !== 'sign-up') return null;
  if (pick && AUTH_SIGNUP_PICKS.has(pick as AuthSignupPick)) return pick as AuthSignupPick;
  if (pick === 'role') return 'path';
  return null;
}

export function readAuthChoiceFromWindow(): AuthViewMode | null {
  if (typeof window === 'undefined') return null;
  return readAuthChoiceFromUrl(window.location.pathname + window.location.search);
}

export function readAuthSignupPickFromWindow(): AuthSignupPick | null {
  if (typeof window === 'undefined') return null;
  return readAuthSignupPickFromUrl(window.location.pathname + window.location.search);
}

export function buildAuthChoicePath(mode: AuthViewMode, signupPick?: AuthSignupPick): string {
  if (mode === 'sign-in') {
    return signupPick === 'client' ? '/?auth=sign-in&pick=client' : '/?auth=sign-in&pick=role';
  }
  return `/?auth=sign-up&pick=${signupPick ?? 'path'}`;
}

export function syncAuthChoiceRoute(
  mode: AuthViewMode,
  replace = false,
  signupPick?: AuthSignupPick
): void {
  const resolvedPick =
    mode === 'sign-up' ? signupPick ?? 'path' : signupPick === 'client' ? 'client' : undefined;
  const nextPath = buildAuthChoicePath(mode, resolvedPick);
  const state = { authChoice: mode, authSignupPick: resolvedPick };
  const pathMatches = currentBrowserPath() === nextPath;
  const existing = window.history.state as {
    authChoice?: AuthViewMode;
    authSignupPick?: AuthSignupPick;
  } | null;
  const stateMatches =
    existing?.authChoice === mode && existing?.authSignupPick === resolvedPick;

  if (pathMatches && stateMatches) return;

  if (replace || pathMatches) {
    window.history.replaceState(state, '', nextPath);
    return;
  }

  window.history.pushState(state, '', nextPath);
}

/** Pop one history entry when possible; otherwise run the fallback navigation. */
export function navigateHistoryBack(fallback: () => void): void {
  if (typeof window === 'undefined') {
    fallback();
    return;
  }
  if (window.history.length > 1) {
    window.history.back();
    return;
  }
  fallback();
}

const LAST_ROUTE_STORAGE_KEY = 'guardr_last_app_route';

function routesEqual(a: AppRoute, b: AppRoute): boolean {
  return buildAppPath(a) === buildAppPath(b);
}

export function persistAppRoute(route: AppRoute, userId?: string | null): void {
  try {
    sessionStorage.setItem(
      LAST_ROUTE_STORAGE_KEY,
      JSON.stringify({ route, userId: userId ?? null, savedAt: Date.now() })
    );
  } catch {
    /* private browsing / quota */
  }
}

export function readPersistedAppRoute(userId?: string | null): AppRoute | null {
  try {
    const raw = sessionStorage.getItem(LAST_ROUTE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { route?: AppRoute; userId?: string | null };
    if (!parsed.route) return null;
    if (userId && parsed.userId && parsed.userId !== userId) return null;
    return parsed.route;
  } catch {
    return null;
  }
}

export function clearPersistedAppRoute(): void {
  try {
    sessionStorage.removeItem(LAST_ROUTE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Resolve the route for the current URL, falling back to the last in-app route for this user. */
export function resolveAppRouteForUser(
  url: string,
  options?: {
    allowPersistedFallback?: boolean;
    userId?: string | null;
    userRole?: AppRole | null;
  }
): AppRoute | null {
  const parsed = parseAppRoute(stripEphemeralQueryParams(url));
  if (parsed) return parsed;
  if (!options?.allowPersistedFallback) return null;
  const { pathname } = parsePath(url);
  if (pathname !== '/' && pathname !== '') return null;
  const persisted = readPersistedAppRoute(options?.userId);
  if (!persisted) return null;
  if (options?.userRole && persisted.role !== options.userRole) return null;
  return persisted;
}

function currentBrowserPath(): string {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  return path + window.location.search;
}

/** True when the route only represents the logged-out auth screen at `/`. */
export function isAuthOnlyRoute(route: AppRoute): boolean {
  return !!route.authView && !route.clientView && !route.guardTab && !route.staffSection;
}

/** Query params that external flows append; strip before persisting in-app routes. */
const EPHEMERAL_QUERY_KEYS = [
  'payment',
  'job_id',
  'deposit',
  'stripe_connect',
  'tip',
  'overtime',
] as const;

export function stripEphemeralQueryParams(url: string): string {
  const { pathname, searchParams } = parsePath(url);
  const params = new URLSearchParams(searchParams.toString());
  for (const key of EPHEMERAL_QUERY_KEYS) {
    params.delete(key);
  }
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function readAppRouteFromPopState(event?: PopStateEvent): AppRoute | null {
  const fromState = (event?.state as { appRoute?: AppRoute } | null)?.appRoute;
  if (fromState) return fromState;
  return parseAppRoute(stripEphemeralQueryParams(window.location.pathname + window.location.search));
}

export function syncAppRoute(route: AppRoute, replace = false): void {
  const nextPath = buildAppPath(route);
  const state = { appRoute: route };
  const pathMatches = currentBrowserPath() === nextPath;
  const existingRoute = (window.history.state as { appRoute?: AppRoute } | null)?.appRoute;
  const stateMatches = !!existingRoute && routesEqual(existingRoute, route);

  if (pathMatches && stateMatches) return;

  persistAppRoute(route);

  if (replace || pathMatches) {
    window.history.replaceState(state, '', nextPath);
    return;
  }

  window.history.pushState(state, '', nextPath);
}

export function defaultRouteForRole(
  role: AppRoute['role'],
  guard?: (Pick<SecurityGuard, 'userStatus' | 'isStaff'> & Partial<SecurityGuard>) | null
): AppRoute {
  switch (role) {
    case 'staff':
      return { role: 'staff', staffSection: 'overview' };
    case 'guard':
      return {
        role: 'guard',
        guardTab: guard && !isGuardNavUnlocked(guard) ? 'activation' : 'map',
      };
    case 'client':
      return { role: 'client', clientView: 'home' };
  }
}

export function websiteAccountRoute(
  role: AppRole,
  view: WebsiteAccountView = 'home'
): AppRoute {
  return { role, websiteAccount: true, accountView: view };
}

/** Clear nested selection params while keeping the top-level section/view. */
export function routeHasNestedSelection(route: AppRoute): boolean {
  return Boolean(
    route.staffGuardId ||
      route.staffClientId ||
      route.staffJobId ||
      route.staffCredentialItemId ||
      route.staffTeamId ||
      route.staffEdit ||
      route.staffGuardTab ||
      route.performanceFactorId ||
      route.clientGuardId ||
      route.clientDirectGuardId ||
      route.clientJobId ||
      route.guardJobId ||
      route.jobChatRequestId ||
      route.teamChatRequestId ||
      route.supportTicketId ||
      route.supportMode ||
      route.staffApprovalQueue ||
      route.openJobChat ||
      route.authView
  );
}

/** Clear nested selection params while keeping the top-level section/view. */
export function routeWithoutNestedSelection(route: AppRoute): AppRoute {
  return {
    ...route,
    staffGuardId: undefined,
    staffClientId: undefined,
    staffJobId: undefined,
    staffCredentialItemId: undefined,
    staffTeamId: undefined,
    staffEdit: undefined,
    staffGuardTab: undefined,
    performanceFactorId: undefined,
    clientGuardId: undefined,
    clientDirectGuardId: undefined,
    clientJobId: undefined,
    guardJobId: undefined,
    jobChatRequestId: undefined,
    teamChatRequestId: undefined,
    supportTicketId: undefined,
    supportSection: undefined,
    supportMode: undefined,
    staffMessageTab: undefined,
    staffApprovalQueue: undefined,
    openJobChat: undefined,
  };
}
