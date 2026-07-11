/** Public site configuration (safe for client bundle) */
export const SITE_DOMAIN = 'guardr.co';
export const SITE_URL =
  ((import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_APP_URL)?.replace(/\/$/, '') ||
  `https://${SITE_DOMAIN}`;
export const SITE_NAME = 'Guardr';

/** Resolve API paths for Capacitor (bundled WebView origin is not guardr.co). */
export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (typeof window === 'undefined') return normalized;
  const capacitor = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  if (capacitor?.isNativePlatform?.()) {
    return `${SITE_URL}${normalized}`;
  }
  return normalized;
}
/** Legal entity operating the Guardr technology platform */
export const LEGAL_ENTITY_NAME = 'Signature Security Specialist, LLC';
export const SIGNATURE_SECURITY_SPECIALIST_URL = 'https://www.signaturesecurityspecialist.com';
/** Parent brand name — technology company, not a licensed PPO on its own */
export const SIGNATURE_SECURITY_SPECIALIST_NAME = 'Signature Security Specialist';
