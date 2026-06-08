/** Public site configuration (safe for client bundle) */
export const SITE_DOMAIN = 'guardr.co';
export const SITE_URL =
  ((import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_APP_URL)?.replace(/\/$/, '') ||
  `https://${SITE_DOMAIN}`;
export const SITE_NAME = 'Guardr';
