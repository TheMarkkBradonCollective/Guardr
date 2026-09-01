import { SITE_DOMAIN, SITE_NAME, SIGNATURE_SECURITY_SPECIALIST_NAME } from './siteConfig';

/** Canonical marketing copy for social graphics, flyers, and promo assets. */
export const MARKETING_TAGLINE = 'Anytime. Anywhere. Security, When You Need It.';

export const MARKETING_HEADLINE = {
  primary: 'SECURITY',
  secondary: 'MARKETPLACE',
} as const;

export const MARKETING_SUBHEADLINE =
  'People and businesses post coverage. Independent contractors choose the jobs. Maps, messaging, and payments — all in one place.';

export const MARKETING_SERVICES_INTRO = 'Post coverage for:';

/** Short list for compact promo graphics (3 bullets). */
export const MARKETING_SERVICES_SHORT = [
  'Event security',
  'Executive protection',
  'Nightlife & venues',
] as const;

/** Full list for flyers and larger layouts (6 bullets). */
export const MARKETING_SERVICES_FULL = [
  'Event security',
  'Construction sites',
  'Retail protection',
  'Nightlife & venues',
  'Corporate campuses',
  'Armed transport',
] as const;

export const MARKETING_CTA_LABEL = 'Open Guardr';

/** Launch city — first market for independent contractors. */
export const MARKETING_LAUNCH_CITY = 'Sacramento';

export const MARKETING_PLATFORM_LINE =
  'A security marketplace — not a security company.';

export const MARKETING_GUARD_HEADLINE = 'Independent contractors: join first.';
export const MARKETING_GUARD_BODY =
  'Licensed guards choose their own jobs, set availability, and get paid through the platform. You do not work for Guardr.';

export const MARKETING_NEED_SECURITY_HEADLINE = 'Need security? Post coverage.';
export const MARKETING_NEED_SECURITY_BODY =
  'People and businesses post a site, hours, and rate. Independent contractors apply. You approve who works your site.';

export const MARKETING_CONTACT = {
  website: `www.${SITE_DOMAIN}`,
  websiteUrl: `https://www.${SITE_DOMAIN}`,
  email: 'support@guardr.co',
  region: 'California',
} as const;

export const MARKETING_BRAND = {
  appName: SITE_NAME,
  parentBrand: SIGNATURE_SECURITY_SPECIALIST_NAME,
  logoAlt: `${SITE_NAME} logo`,
} as const;
