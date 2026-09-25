/** Public site configuration (safe for client bundle) */
export const SITE_DOMAIN = 'guardr.co';
/** Use www — apex guardr.co 307-redirects and breaks native POST fetch in the APK WebView. */
export const SITE_URL =
  ((import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_APP_URL)?.replace(/\/$/, '') ||
  'https://www.guardr.co';
/** Serverless API host (Stripe, push fan-out). Defaults to the public site; override with VITE_API_BASE_URL. */
export const API_BASE_URL =
  ((import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_BASE_URL)?.replace(/\/$/, '') ||
  SITE_URL;
export const SITE_NAME = 'Guardr';

/** Public install / APK download page */
export const APP_DOWNLOAD_PAGE_PATH = '/download';

export function resolveAppDownloadPageUrl(): string {
  return apiUrl(APP_DOWNLOAD_PAGE_PATH);
}

/** Resolve API paths for Capacitor (bundled WebView origin is not guardr.co). */
export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (typeof window === 'undefined') return normalized;
  const capacitor = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  if (capacitor?.isNativePlatform?.()) {
    return `${API_BASE_URL}${normalized}`;
  }
  return normalized;
}
/** Legal entity operating the Guardr technology platform */
export const LEGAL_ENTITY_NAME = 'Signature Security Specialist, LLC';
export const SIGNATURE_SECURITY_SPECIALIST_URL = 'https://www.signaturesecurityspecialist.com';
/** Parent brand name — technology company, not a licensed PPO on its own */
export const SIGNATURE_SECURITY_SPECIALIST_NAME = 'Signature Security Specialist';

/** Sage green — reserved for Signature Security Specialist mentions only. */
export const SIGNATURE_SECURITY_SAGE = '#5E7B61';
export const SIGNATURE_SECURITY_SAGE_DARK = '#7AAE7F';
