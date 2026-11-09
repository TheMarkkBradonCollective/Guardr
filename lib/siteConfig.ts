/** Production app origin — Cloudflare Worker until custom domain cutover. */
export const WORKER_DEPLOY_URL = 'https://www.guardr.co';

/** Marketing domain (unchanged until DNS moves). */
export const PRODUCTION_SITE_URL = WORKER_DEPLOY_URL;

export const SITE_DOMAIN = 'www.guardr.co';

export function getSiteUrl(): string {
  const configured = process.env.APP_URL?.trim().replace(/\/$/, '');
  if (configured) return configured;
  return WORKER_DEPLOY_URL;
}

export function getPublicAppUrl(): string {
  const vite = process.env.VITE_APP_URL?.trim().replace(/\/$/, '');
  if (vite) return vite;
  return getSiteUrl();
}
