import { Capacitor } from '@capacitor/core';
import { isAppExperience } from './platform/appExperience';
import { SITE_URL } from './siteConfig';

/** Role that owns an operational app. Mirrors AppRole without a circular import. */
export type ProductRole = 'client' | 'guard' | 'staff';

/**
 * Four product environments in one platform.
 *
 * Device surfaces (mobile / tablet / desktop) are how each environment is
 * laid out. Product apps are *who the product is for*:
 *
 *   website     marketing, signup through activation, customer/guard accounts, and full staff ops
 *   client-app  customer operations (Customer) — Android only after activation
 *   guard-app   guard field operations (Guard) — Android only after activation
 *   staff-app   optional Staff APK; the same system also runs on the website
 */
export type ProductApp = 'website' | 'client' | 'guard' | 'staff';

export type WebsiteAccountView =
  | 'home'
  | 'profile'
  | 'billing'
  | 'payouts'
  | 'downloads'
  | 'settings'
  | 'support'
  | 'documents';

const WEBSITE_ACCOUNT_VIEWS = new Set<WebsiteAccountView>([
  'home',
  'profile',
  'billing',
  'payouts',
  'downloads',
  'settings',
  'support',
  'documents',
]);

export const PRODUCT_APP_LABELS: Record<ProductApp, string> = {
  website: 'Guardr',
  client: 'Customer',
  guard: 'Guard',
  staff: 'Staff',
};

/** Text under the Guardr logo / home-screen icon. */
export const PRODUCT_APP_ICON_LABELS: Record<ProductApp, string> = {
  website: 'Guardr',
  client: 'Customer',
  guard: 'Guard',
  staff: 'Staff',
};

export const PRODUCT_APP_SHORT_LABELS: Record<ProductApp, string> = {
  website: 'Website',
  client: 'Customer',
  guard: 'Guard',
  staff: 'Staff',
};

export function productAppIconLabel(role: ProductRole | string | null | undefined): string {
  return PRODUCT_APP_ICON_LABELS[productAppForRole(role)];
}

/** Guard launcher is a white tile with a black mark. Customer is black + white. Staff is grey. */
export function productAppHasLightLauncher(app: ProductApp | string): boolean {
  return app === 'guard';
}

export function productAppHasGreyLauncher(app: ProductApp | string): boolean {
  return app === 'staff';
}

export const PRODUCT_APP_TAGLINES: Record<ProductApp, string> = {
  website: 'Account, billing, and support',
  client: 'Coverage, activity, and reports',
  guard: 'Shifts, check-in, and field work',
  staff: 'Operations, people, and administration',
};

export const PRODUCT_APP_PATH_PREFIX: Record<Exclude<ProductApp, 'website'>, string> = {
  client: '/client',
  guard: '/guard',
  staff: '/staff',
};

export const NATIVE_URL_SCHEMES: Record<Exclude<ProductApp, 'website'>, string> = {
  client: 'guardr-client',
  guard: 'guardr-guard',
  staff: 'guardr-staff',
};

const PRODUCT_APP_STORAGE_KEY = 'guardr_product_app';

export function isWebsiteAccountView(value: string | null | undefined): value is WebsiteAccountView {
  return !!value && WEBSITE_ACCOUNT_VIEWS.has(value as WebsiteAccountView);
}

export function productAppForRole(role: ProductRole | string | null | undefined): Exclude<ProductApp, 'website'> {
  if (role === 'client') return 'client';
  if (role === 'guard') return 'guard';
  return 'staff';
}

export function productRoleForApp(app: ProductApp): ProductRole | null {
  if (app === 'client' || app === 'guard' || app === 'staff') return app;
  return null;
}

/**
 * How Sign in / Sign up should open inside an installed Guard / Customer / Staff app.
 * Those shells already are one role — do not show "Log in as guard / customer / staff".
 * Customer sign-in and sign-up both pick personal / business / security company.
 */
export function installedAuthEntry(
  productApp: ProductApp,
  _mode: 'sign-in' | 'sign-up',
): { type: 'form'; role: ProductRole } | { type: 'client-kind' } | { type: 'role-picker' } {
  const role = productRoleForApp(productApp);
  if (!role) return { type: 'role-picker' };
  if (role === 'client') return { type: 'client-kind' };
  return { type: 'form', role };
}

export function productAppLabelForRole(role: ProductRole | string | null | undefined): string {
  return PRODUCT_APP_LABELS[productAppForRole(role)];
}

function parsePathname(url: string): string {
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : 'http://localhost';
    return new URL(url, base).pathname.replace(/\/$/, '') || '/';
  } catch {
    return '/';
  }
}

export function isWebsiteAccountPath(url: string): boolean {
  const pathname = parsePathname(url);
  return pathname === '/account' || pathname.startsWith('/account/');
}

export function isOperationalAppPath(url: string): boolean {
  const pathname = parsePathname(url);
  return (
    pathname === '/client' ||
    pathname.startsWith('/client/') ||
    pathname === '/guard' ||
    pathname.startsWith('/guard/') ||
    pathname === '/staff' ||
    pathname.startsWith('/staff/') ||
    pathname === '/dispatch' ||
    pathname.startsWith('/app/') ||
    pathname === '/messenger' ||
    pathname.startsWith('/messenger/')
  );
}

export function parseWebsiteAccountView(url: string): WebsiteAccountView | null {
  const pathname = parsePathname(url);
  if (pathname === '/account') return 'home';
  const match = pathname.match(/^\/account\/([^/]+)$/);
  if (!match) return null;
  const slug = match[1] === 'payments' || match[1] === 'invoices' || match[1] === 'receipts' ? 'billing' : match[1];
  return isWebsiteAccountView(slug) ? slug : 'home';
}

export function buildWebsiteAccountPath(view: WebsiteAccountView = 'home'): string {
  if (view === 'home') return '/account';
  return `/account/${view}`;
}

export function productAppFromPath(url: string): ProductApp {
  const pathname = parsePathname(url);
  if (pathname === '/account' || pathname.startsWith('/account/')) return 'website';
  if (pathname === '/messenger' || pathname.startsWith('/messenger/')) {
    return readStoredProductApp() ?? 'website';
  }
  if (pathname === '/client' || pathname.startsWith('/client/') || pathname.startsWith('/app/client')) {
    return 'client';
  }
  if (pathname === '/guard' || pathname.startsWith('/guard/') || pathname.startsWith('/app/guard')) {
    return 'guard';
  }
  if (
    pathname === '/staff' ||
    pathname.startsWith('/staff/') ||
    pathname === '/dispatch' ||
    pathname.startsWith('/app/staff')
  ) {
    return 'staff';
  }
  return 'website';
}

export function readStoredProductApp(): ProductApp | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PRODUCT_APP_STORAGE_KEY);
    if (raw === 'website' || raw === 'client' || raw === 'guard' || raw === 'staff') return raw;
  } catch {
    /* private browsing */
  }
  return null;
}

export function persistProductApp(app: ProductApp): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PRODUCT_APP_STORAGE_KEY, app);
  } catch {
    /* ignore */
  }
}

/** Messenger sign-out: forget the last role so the next sign-in picks Guard / Customer / Staff again. */
export function clearStoredProductApp(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(PRODUCT_APP_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Native APK should open the role app, never the marketing website.
 * Browser tabs: customers and guards stay on /account; staff get /staff.
 */
declare global {
  interface Window {
    __GUARDR_NATIVE_PRODUCT_APP__?: string;
  }
}

export const NATIVE_APPLICATION_IDS: Record<Exclude<ProductApp, 'website'>, string> = {
  client: 'com.signaturesecurity.guardr.client',
  guard: 'com.signaturesecurity.guardr.guard',
  staff: 'com.signaturesecurity.guardr.staff',
};

export function parseBakedNativeProductApp(
  value: string | null | undefined,
): Exclude<ProductApp, 'website'> | null {
  if (value === 'client' || value === 'guard' || value === 'staff') return value;
  return null;
}

/** Product app baked into a role-specific APK (empty string on website / combined APK). */
export function bakedNativeProductApp(): Exclude<ProductApp, 'website'> | null {
  if (typeof window === 'undefined') return null;
  return parseBakedNativeProductApp(window.__GUARDR_NATIVE_PRODUCT_APP__);
}

export function resolveProductApp(input: {
  url?: string;
  isInstalledShell?: boolean;
  stored?: ProductApp | null;
  baked?: ProductApp | null;
}): ProductApp {
  const url = input.url ?? (typeof window !== 'undefined' ? window.location.pathname : '/');
  const fromPath = productAppFromPath(url);
  if (fromPath !== 'website') return fromPath;
  if (isWebsiteAccountPath(url)) return 'website';
  const baked = parseBakedNativeProductApp(
    input.baked === undefined ? bakedNativeProductApp() : input.baked,
  );
  if (input.isInstalledShell ?? isAppExperience()) {
    return baked ?? input.stored ?? readStoredProductApp() ?? 'website';
  }
  return baked ?? 'website';
}

/** Active marketplace roles can use the full app in a browser tab (not only APK/PWA). */
export function canUseOperationalAppInBrowser(role: ProductRole): boolean {
  return role === 'staff' || role === 'client' || role === 'guard';
}

/**
 * What a signed-in Guard / Customer / Staff user may do in a website browser tab.
 *
 *   operations  — full role app (Staff, or any role inside an APK)
 *   activation  — signup through activation / pending review (Guard & Customer)
 *   account     — profile, billing, support only; platform use needs the app
 */
export type WebsiteShellAccess = 'operations' | 'activation' | 'account';

export function websiteShellAccess(input: {
  role: ProductRole;
  isInstalledShell?: boolean;
  guardStatus?: string | null;
  clientStatus?: string | null;
}): WebsiteShellAccess {
  if (input.isInstalledShell) return 'operations';
  if (input.role === 'staff') return 'operations';
  if (input.role === 'guard') {
    const status = (input.guardStatus ?? '').trim().toLowerCase();
    if (status === 'active' || status === 'suspended' || status === 'blocked') return 'operations';
    return 'activation';
  }
  const status = (input.clientStatus ?? '').trim().toLowerCase();
  if (status === 'active' || status === 'suspended') return 'operations';
  return 'activation';
}

export function shouldLandOnWebsiteAccount(
  role: ProductRole,
  isInstalledShell = isAppExperience(),
  status?: { guardStatus?: string | null; clientStatus?: string | null },
): boolean {
  return websiteShellAccess({ role, isInstalledShell, ...status }) === 'account';
}

export function defaultOperationalPathForRole(role: ProductRole): string {
  if (role === 'client') return '/client/home';
  if (role === 'guard') return '/guard/map';
  return '/staff/overview';
}

export function defaultActivationPathForRole(role: ProductRole): string {
  if (role === 'guard') return '/guard/activation';
  if (role === 'client') return '/client/home';
  return defaultOperationalPathForRole(role);
}

export function defaultPathForSignedInUser(
  role: ProductRole,
  isInstalledShell = isAppExperience(),
  status?: { guardStatus?: string | null; clientStatus?: string | null },
): string {
  const access = websiteShellAccess({ role, isInstalledShell, ...status });
  if (access === 'account') return '/account';
  if (access === 'activation') return defaultActivationPathForRole(role);
  return defaultOperationalPathForRole(role);
}

export function websiteNeedsAppMessage(role: ProductRole): string {
  if (role === 'client') {
    return 'Use the Customer workspace in this browser, or install the app for mobile.';
  }
  if (role === 'guard') {
    return 'Use the Guard workspace in this browser, or install the app for field work.';
  }
  return '';
}

export function websiteAccountViewsForRole(role: ProductRole): { id: WebsiteAccountView; label: string }[] {
  const views: { id: WebsiteAccountView; label: string }[] = [
    { id: 'home', label: 'Account' },
    { id: 'profile', label: 'Profile' },
  ];
  if (role === 'client') views.push({ id: 'billing', label: 'Billing' });
  if (role === 'guard') views.push({ id: 'payouts', label: 'Payouts' });
  if (role === 'staff') views.push({ id: 'billing', label: 'Billing' });
  views.push(
    { id: 'downloads', label: 'Downloads' },
    { id: 'settings', label: 'Settings' },
    { id: 'documents', label: 'Documents' },
    { id: 'support', label: 'Support' },
  );
  return views;
}

export function openAppCtaCopy(role: ProductRole): { title: string; body: string; action: string } {
  const app = productAppForRole(role);
  if (app === 'client') {
    return {
      title: 'This feature is available in Customer',
      body: 'Request coverage, track activity, message guards, and review reports in the Customer app.',
      action: 'Open Customer',
    };
  }
  if (app === 'guard') {
    return {
      title: 'This feature is available in Guard',
      body: 'Shifts, check-in, patrols, incidents, and pay live in the Guard app — not on the website.',
      action: 'Open Guard',
    };
  }
  return {
    title: 'Open operations',
    body: 'Dispatch, people, incidents, and administration run here in the browser. The Staff app is optional.',
    action: 'Open operations',
  };
}

export function installPathForApp(_app: Exclude<ProductApp, 'website'>): string {
  return buildWebsiteAccountPath('downloads');
}

export function webAppPathForRole(role: ProductRole, destination?: string): string {
  const base = defaultOperationalPathForRole(role);
  if (!destination) return base;
  if (destination.startsWith('/')) return destination;
  const prefix = PRODUCT_APP_PATH_PREFIX[productAppForRole(role)];
  return `${prefix}/${destination}`;
}

export function nativeDeepLinkForRole(role: ProductRole, path?: string): string {
  const app = productAppForRole(role);
  const dest = path ?? defaultOperationalPathForRole(role);
  const prefix = PRODUCT_APP_PATH_PREFIX[app];
  let relative = dest.startsWith('/') ? dest : `/${dest}`;
  if (relative === prefix || relative.startsWith(`${prefix}/`)) {
    relative = relative.slice(prefix.length) || '/';
  }
  return `${NATIVE_URL_SCHEMES[app]}://${relative.replace(/^\//, '')}`;
}

export function httpsDeepLinkForPath(path: string): string {
  const relative = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${relative}`;
}

/**
 * Convert a custom-scheme or https deep link into an in-app path.
 * Examples:
 *   guardr-guard://map → /guard/map
 *   https://www.guardr.co/client/home → /client/home
 */
export function pathFromDeepLink(url: string): string | null {
  try {
    const parsed = new URL(url);
    const scheme = parsed.protocol.replace(/:$/, '');
    if (scheme === 'http' || scheme === 'https') {
      const path = `${parsed.pathname}${parsed.search}`;
      return path || '/';
    }
    if (scheme === 'guardr-client') {
      const rest = `${parsed.host}${parsed.pathname}`.replace(/^\/+/, '');
      return rest ? `/client/${rest}` : '/client/home';
    }
    if (scheme === 'guardr-guard') {
      const rest = `${parsed.host}${parsed.pathname}`.replace(/^\/+/, '');
      return rest ? `/guard/${rest}` : '/guard/map';
    }
    if (scheme === 'guardr-staff') {
      const rest = `${parsed.host}${parsed.pathname}`.replace(/^\/+/, '');
      return rest ? `/staff/${rest}` : '/staff/overview';
    }
    if (scheme === 'guardr-messenger') {
      return parsed.search ? `/messenger${parsed.search}` : '/messenger';
    }
    if (scheme === 'guardr' || scheme === 'com.signaturesecurity.guardr') {
      const rest = `${parsed.host}${parsed.pathname}`.replace(/^\/+/, '');
      return rest ? `/${rest}` : '/';
    }
  } catch {
    return null;
  }
  return null;
}

export function applyProductAppToDocument(app: ProductApp): void {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.productApp = app;
  document.body.dataset.productApp = app;
  document.body.classList.toggle('product-website', app === 'website');
  document.body.classList.toggle('product-client', app === 'client');
  document.body.classList.toggle('product-guard', app === 'guard');
  document.body.classList.toggle('product-staff', app === 'staff');
  persistProductApp(app);
}

export function isNativePlatform(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function roleCanOpenProductApp(role: ProductRole, app: ProductApp): boolean {
  if (app === 'website') return true;
  return productAppForRole(role) === app;
}

export function wrongAppMessage(requested: ProductApp, role: ProductRole): string {
  const requestedLabel = PRODUCT_APP_LABELS[requested];
  const ownLabel = productAppLabelForRole(role);
  return `${requestedLabel} is for a different role. Opening ${ownLabel} instead.`;
}

const POST_AUTH_PATH_KEY = 'guardr_post_auth_path';

export function persistPostAuthPath(url: string): void {
  if (typeof window === 'undefined') return;
  if (!isOperationalAppPath(url) && !isWebsiteAccountPath(url)) return;
  try {
    sessionStorage.setItem(POST_AUTH_PATH_KEY, url);
  } catch {
    /* ignore */
  }
}

export function consumePostAuthPath(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(POST_AUTH_PATH_KEY);
    sessionStorage.removeItem(POST_AUTH_PATH_KEY);
    return raw;
  } catch {
    return null;
  }
}
