import type { ClientView } from '../components/ClientDashboard';
import type { GuardTab } from '../components/GuardDashboard';
import type { AppRole, AppRoute } from './appNavigation';
import { isStaffSupportSection, type StaffSection } from './staffOps';
import { SITE_URL } from './siteConfig';
import { isMessengerExperience } from './platform/appExperience';
import { isStandaloneDisplay } from './platform/displayMode';
import {
  defaultOperationalPathForRole,
  nativeDeepLinkForRole,
  type ProductRole,
} from './productApps';
import { isMessagingNotificationType } from './notificationChannel';

const MESSENGER_GUARD_TABS = new Set<GuardTab>([
  'messages',
  'support',
  'settings',
  'profile',
  'guide',
]);

const MESSENGER_CLIENT_VIEWS = new Set<ClientView>([
  'messages',
  'support',
  'support-compose',
  'support-report',
  'settings',
  'profile',
  'guide',
]);

const MESSENGER_STAFF_SECTIONS = new Set<StaffSection>(['messages', 'support', 'profile', 'preferences', 'guide']);

export function defaultMessengerRoute(role: AppRole): AppRoute {
  if (role === 'guard') return { role: 'guard', guardTab: 'messages' };
  if (role === 'client') return { role: 'client', clientView: 'messages' };
  return { role: 'staff', staffSection: 'messages' };
}

export function constrainGuardTabToMessenger(tab: GuardTab): GuardTab {
  if (tab === 'support') return 'support';
  if (MESSENGER_GUARD_TABS.has(tab)) return tab;
  return 'messages';
}

export function constrainClientViewToMessenger(view: ClientView): ClientView {
  if (MESSENGER_CLIENT_VIEWS.has(view)) return view;
  return 'messages';
}

export function constrainStaffSectionToMessenger(section: StaffSection): StaffSection {
  if (isStaffSupportSection(section)) return 'support';
  if (MESSENGER_STAFF_SECTIONS.has(section)) return section;
  return 'messages';
}

/** Signed-in Messenger stays on messages and support — never field ops, jobs, or dispatch. */
export function constrainRouteToMessenger(route: AppRoute): AppRoute {
  if (route.authView) return route;
  if (route.role === 'guard') {
    const tab = route.guardTab ?? 'messages';
    return {
      ...route,
      websiteAccount: undefined,
      accountView: undefined,
      guardTab: constrainGuardTabToMessenger(tab === 'activation' ? 'messages' : tab),
      messengerCompanion: true,
    };
  }
  if (route.role === 'client') {
    return {
      ...route,
      websiteAccount: undefined,
      accountView: undefined,
      clientView: constrainClientViewToMessenger(route.clientView ?? 'messages'),
      messengerCompanion: true,
    };
  }
  return {
    ...route,
    websiteAccount: undefined,
    accountView: undefined,
    staffSection: constrainStaffSectionToMessenger(route.staffSection ?? 'messages'),
    messengerCompanion: true,
  };
}

export const MESSENGER_PATH = '/messenger';
export const MESSENGER_INSTALLED_KEY = 'guardr_messenger_installed';
export const MESSENGER_SCHEME = 'guardr-messenger';

export function isMessengerPath(url: string): boolean {
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    const pathname = new URL(url, base).pathname.replace(/\/$/, '') || '/';
    return pathname === MESSENGER_PATH || pathname.startsWith(`${MESSENGER_PATH}/`);
  } catch {
    const pathname = url.split('?')[0]?.replace(/\/$/, '') || '/';
    return pathname === MESSENGER_PATH || pathname.startsWith(`${MESSENGER_PATH}/`);
  }
}

/** Persist the install flag only from a dedicated Messenger shell — never a website tab. */
export function shouldPersistMessengerInstall(input: {
  messengerExperience: boolean;
  standalone: boolean;
  messengerPath: boolean;
}): boolean {
  return input.messengerExperience || (input.standalone && input.messengerPath);
}

export function markMessengerInstalled(): void {
  if (typeof window === 'undefined') return;
  if (
    !shouldPersistMessengerInstall({
      messengerExperience: isMessengerExperience(),
      standalone: isStandaloneDisplay(),
      messengerPath: isMessengerPath(window.location.href),
    })
  ) {
    return;
  }
  try {
    localStorage.setItem(MESSENGER_INSTALLED_KEY, '1');
  } catch {
    /* private browsing */
  }
}

export function clearMessengerInstalled(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(MESSENGER_INSTALLED_KEY);
  } catch {
    /* ignore */
  }
}

export function isMessengerInstalledLocally(): boolean {
  if (typeof window === 'undefined') return false;
  if (isMessengerExperience()) return true;
  if (isMessengerPath(typeof window !== 'undefined' ? window.location.href : '')) {
    return isStandaloneDisplay() || isMessengerExperience();
  }
  try {
    return localStorage.getItem(MESSENGER_INSTALLED_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * True when this runtime *is* Messenger (APK bake, PWA start URL, or path).
 * Distinct from "Messenger is installed somewhere else on this device".
 */
export function isMessengerCompanionRuntime(): boolean {
  if (isMessengerExperience()) return true;
  if (typeof window === 'undefined') return false;
  return isMessengerPath(window.location.href);
}

export function buildMessengerPath(query?: Record<string, string | undefined | null>): string {
  const params = new URLSearchParams();
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value) params.set(key, value);
    }
  }
  const qs = params.toString();
  return qs ? `${MESSENGER_PATH}?${qs}` : MESSENGER_PATH;
}

export function messengerPathFromNotification(input: {
  type?: string;
  requestId?: string;
  ticketId?: string;
  url?: string;
}): string {
  return buildMessengerPath({
    jc: input.requestId,
    st: input.ticketId,
    chat: input.requestId ? '1' : undefined,
    type: input.type,
  });
}

/** Rewrite a role-app messages URL onto the Messenger companion. */
export function toMessengerDeepLink(url: string): string {
  try {
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.origin : SITE_URL);
    const params: Record<string, string> = {};
    parsed.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return buildMessengerPath(params);
  } catch {
    return MESSENGER_PATH;
  }
}

/** True when conversation alerts should leave the main-app inbox. */
export function shouldRouteMessagingToMessenger(): boolean {
  return isMessengerInstalledLocally() || isMessengerCompanionRuntime();
}

export function shouldOpenInMessenger(type: string | null | undefined, messengerAvailable: boolean): boolean {
  return messengerAvailable && isMessagingNotificationType(type);
}

export function nativeMessengerDeepLink(path = MESSENGER_PATH): string {
  const relative = path.startsWith('/') ? path.slice(1) : path;
  return `${MESSENGER_SCHEME}://${relative}`;
}

export function httpsMessengerLink(path = MESSENGER_PATH): string {
  const relative = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${relative}`;
}

export function openMainAppFromMessenger(role: ProductRole, destination?: string): void {
  if (typeof window === 'undefined') return;
  const path = destination ?? defaultOperationalPathForRole(role);
  const native = nativeDeepLinkForRole(role, path);
  const started = Date.now();
  try {
    window.location.assign(native);
  } catch {
    /* fall through */
  }
  window.setTimeout(() => {
    if (Date.now() - started < 1800 && document.visibilityState === 'visible') {
      window.location.assign(path);
    }
  }, 700);
}

export function openMessengerFromMainApp(destination = MESSENGER_PATH): void {
  if (typeof window === 'undefined') return;
  const native = nativeMessengerDeepLink(destination);
  const started = Date.now();
  try {
    window.location.assign(native);
  } catch {
    /* fall through */
  }
  window.setTimeout(() => {
    if (Date.now() - started < 1800 && document.visibilityState === 'visible') {
      window.history.pushState({ appRoute: { messengerCompanion: true } }, '', destination);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  }, 700);
}

export const MESSENGER_APP_LABEL = 'Messenger';
export const MESSENGER_APP_TAGLINE = 'Messages, support, and team chat';
