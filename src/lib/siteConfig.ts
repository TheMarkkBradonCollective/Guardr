/** Public site configuration (safe for client bundle) */
export const SITE_DOMAIN = 'guardr.co';
export const SITE_URL =
  ((import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_APP_URL)?.replace(/\/$/, '') ||
  `https://${SITE_DOMAIN}`;
export const SITE_NAME = 'Guardr';
export const SIGNATURE_SECURITY_SPECIALIST_URL = 'https://www.signaturesecurityspecialist.com';
export const SIGNATURE_SECURITY_SPECIALIST_NAME = 'Signature Security Specialist';
