import { SITE_DOMAIN, SITE_NAME, SIGNATURE_SECURITY_SPECIALIST_NAME } from './siteConfig';

/** Canonical marketing copy for social graphics, flyers, and promo assets. */
export const MARKETING_TAGLINE = 'Anytime. Anywhere. Security, When You Need It.';

export const MARKETING_HEADLINE = {
  primary: 'SECURITY',
  secondary: 'MARKETPLACE',
} as const;

export const MARKETING_SUBHEADLINE =
  'Clients post jobs. Licensed guards choose assignments. Maps, messaging, and payments — all in one place.';

export const MARKETING_SERVICES_INTRO = 'Post coverage for:';

/** Short list for compact promo graphics (3 bullets). */
export const MARKETING_SERVICES_SHORT = [
  'Event security',
  'Construction sites',
  'Executive protection',
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

export const MARKETING_CTA_LABEL = 'Get started';

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
