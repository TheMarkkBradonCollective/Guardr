/** Production site URL — used when APP_URL is not set in production */
export const PRODUCTION_SITE_URL = 'https://guardr.co';

export const SITE_DOMAIN = 'guardr.co';

export function getSiteUrl(): string {
  const configured = process.env.APP_URL?.trim().replace(/\/$/, '');
  if (configured) return configured;
  return process.env.NODE_ENV === 'production' ? PRODUCTION_SITE_URL : 'http://localhost:3000';
}
