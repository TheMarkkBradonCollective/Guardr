import type { ClientView } from '../components/ClientDashboard';
import type { GuardTab } from '../components/GuardDashboard';
import { normalizeStaffSection, type StaffSection } from './staffOps';

export type AppRole = 'staff' | 'guard' | 'client';

export interface AppRoute {
  role: AppRole;
  staffSection?: StaffSection;
  guardTab?: GuardTab;
  clientView?: ClientView;
  guardId?: string;
}

const GUARD_TAB_FROM_SLUG: Record<string, GuardTab> = {
  map: 'map',
  'my-jobs': 'myJobs',
  jobs: 'myJobs',
  earnings: 'earnings',
  pay: 'earnings',
  support: 'support',
  profile: 'profile',
};

const GUARD_TAB_TO_SLUG: Record<GuardTab, string> = {
  map: 'map',
  myJobs: 'my-jobs',
  earnings: 'earnings',
  support: 'support',
  profile: 'profile',
};

const CLIENT_VIEW_FROM_SLUG: Record<string, ClientView> = {
  home: 'home',
  message: 'message',
  appointment: 'appointment',
  medication: 'medication',
  tracker: 'tracker',
  search: 'search',
  profile: 'profile',
  support: 'support',
  map: 'map',
  request: 'request',
  'direct-request': 'direct-request',
  coverage: 'coverage',
  reports: 'reports',
  requests: 'requests',
  guards: 'guards',
};

const CLIENT_VIEW_TO_SLUG: Partial<Record<ClientView, string>> = {
  home: 'home',
  message: 'message',
  appointment: 'appointment',
  medication: 'medication',
  tracker: 'tracker',
  search: 'search',
  profile: 'profile',
  support: 'support',
  map: 'map',
  request: 'request',
  'direct-request': 'direct-request',
  coverage: 'coverage',
  reports: 'reports',
  requests: 'requests',
  guards: 'guards',
};

function parsePath(url: string): { pathname: string; search: string } {
  try {
    const parsed = new URL(url, window.location.origin);
    return {
      pathname: parsed.pathname.replace(/\/$/, '') || '/',
      search: parsed.search,
    };
  } catch {
    return { pathname: '/', search: '' };
  }
}

/** Read the in-app destination from the current URL (path + legacy push links). */
export function parseAppRoute(url: string): AppRoute | null {
  const { pathname } = parsePath(url);

  if (pathname === '/dispatch') {
    return { role: 'staff', staffSection: 'jobs' };
  }

  const staffMatch = pathname.match(/^\/staff\/([^/]+)$/);
  if (staffMatch) {
    const section = normalizeStaffSection(staffMatch[1]);
    if (section) return { role: 'staff', staffSection: section };
  }

  if (pathname === '/guard') {
    return { role: 'guard', guardTab: 'map' };
  }

  const guardWithIdMatch = pathname.match(/^\/guard\/([^/]+)$/);
  if (guardWithIdMatch) {
    const slug = guardWithIdMatch[1];
    const tab = GUARD_TAB_FROM_SLUG[slug];
    if (tab) return { role: 'guard', guardTab: tab };
    return { role: 'guard', guardTab: 'map', guardId: slug };
  }

  const clientMatch = pathname.match(/^\/client\/([^/]+)$/);
  if (clientMatch) {
    const view = CLIENT_VIEW_FROM_SLUG[clientMatch[1]];
    if (view) return { role: 'client', clientView: view };
  }

  return null;
}

export function buildAppPath(route: AppRoute): string {
  switch (route.role) {
    case 'staff':
      return `/staff/${route.staffSection ?? 'overview'}`;
    case 'guard':
      return `/guard/${GUARD_TAB_TO_SLUG[route.guardTab ?? 'map']}`;
    case 'client':
      return `/client/${CLIENT_VIEW_TO_SLUG[route.clientView ?? 'home'] ?? 'home'}`;
    default:
      return '/';
  }
}

export function readAppRouteFromWindow(): AppRoute | null {
  return parseAppRoute(window.location.pathname + window.location.search);
}

export function syncAppRoute(route: AppRoute, replace = false): void {
  const nextPath = buildAppPath(route);
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  if (currentPath === nextPath) return;

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
