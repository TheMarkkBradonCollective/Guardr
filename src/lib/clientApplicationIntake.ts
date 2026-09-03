import type { ClientType } from '../types';
import { normalizeClientType } from './clientType';

/** Sections shown on customer sign-up — each account type has its own application. */
export type ClientApplicationSection =
  | 'contact'
  | 'organization'
  | 'ppo-license'
  | 'business-profile'
  | 'coverage-needs'
  | 'service-area'
  | 'prior-security-experience'
  | 'referral';

export interface ClientApplicationIntakeConfig {
  type: ClientType;
  headline: string;
  subhead: string;
  staffReviewFocus: string;
  sections: readonly ClientApplicationSection[];
}

const PERSONAL_INTAKE: ClientApplicationIntakeConfig = {
  type: 'personal',
  headline: 'Personal account',
  subhead:
    'You hire and pay as an individual. Request coverage once or as often as you need — including recurring services.',
  staffReviewFocus: 'Identity, service area, and whether the request is appropriate for a personal contracting party.',
  sections: ['contact', 'coverage-needs', 'service-area', 'prior-security-experience', 'referral'],
};

const BUSINESS_INTAKE: ClientApplicationIntakeConfig = {
  type: 'business',
  headline: 'Business account',
  subhead:
    'Your organization hires and pays, with tools for sites, staffing, and team access.',
  staffReviewFocus: 'Organization legitimacy, billing contact, sites, and expected job volume.',
  sections: [
    'organization',
    'business-profile',
    'contact',
    'coverage-needs',
    'service-area',
    'prior-security-experience',
    'referral',
  ],
};

const SECURITY_COMPANY_INTAKE: ClientApplicationIntakeConfig = {
  type: 'security-company',
  headline: 'Security company account',
  subhead:
    'Licensed PPO workspace for roster management and marketplace overflow — Guardr staff verify your license, not your shift operations.',
  staffReviewFocus: 'BSIS PPO license, company identity, service markets, and credential uploads before first job post.',
  sections: ['organization', 'ppo-license', 'contact', 'coverage-needs', 'service-area', 'referral'],
};

const INTAKE_BY_TYPE: Record<ClientType, ClientApplicationIntakeConfig> = {
  personal: PERSONAL_INTAKE,
  business: BUSINESS_INTAKE,
  'security-company': SECURITY_COMPANY_INTAKE,
};

export function clientApplicationIntake(
  clientType: ClientType | undefined
): ClientApplicationIntakeConfig {
  return INTAKE_BY_TYPE[normalizeClientType(clientType)];
}

export function clientApplicationShowsSection(
  clientType: ClientType | undefined,
  section: ClientApplicationSection
): boolean {
  return clientApplicationIntake(clientType).sections.includes(section);
}
