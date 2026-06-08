/** Production site URL — used when APP_URL is not set in production */
/** Use www until apex SSL is fully provisioned on Vercel */
export const PRODUCTION_SITE_URL = 'https://www.guardr.co';

export const SITE_DOMAIN = 'guardr.co';

export function getSiteUrl(): string {
  const configured = process.env.APP_URL?.trim().replace(/\/$/, '');
  if (configured) return configured;
  return process.env.NODE_ENV === 'production' || process.env.VERCEL
    ? PRODUCTION_SITE_URL
    : 'http://localhost:3000';
}
