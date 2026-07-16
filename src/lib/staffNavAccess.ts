import type { StaffSection } from './staffOps';

export interface StaffNavAccessFlags {
  showFinance: boolean;
  showSettings: boolean;
  showDisputes: boolean;
  showCities: boolean;
}

export interface StaffNavAccessNotice {
  title: string;
  message: string;
}

const FINANCE_SECTIONS = new Set<StaffSection>([
  'payments',
  'payment-settings',
  'agreements',
  'audit-log',
  'dev-updates',
]);

const SETTINGS_SECTIONS = new Set<StaffSection>(['settings']);
const CITIES_SECTIONS = new Set<StaffSection>(['cities']);
const DISPUTES_SECTIONS = new Set<StaffSection>(['disputes']);

export function getStaffNavAccessNotice(
  section: StaffSection,
  flags: StaffNavAccessFlags,
): StaffNavAccessNotice | null {
  if (FINANCE_SECTIONS.has(section) && !flags.showFinance) {
    return {
      title: 'Director access required',
      message:
        'Financial controls, payment settings, agreements, audit log, and dev notes are limited to Director and Founder roles. Ask your Director if you need access.',
    };
  }
  if (SETTINGS_SECTIONS.has(section) && !flags.showSettings) {
    return {
      title: 'Administrator access required',
      message:
        'Platform settings are limited to Administrator roles and above. Ask your Director to update approval rules, integrations, or other system-wide controls.',
    };
  }
  if (CITIES_SECTIONS.has(section) && !flags.showCities) {
    return {
      title: 'Manager access required',
      message:
        'Operations controls are limited to Manager roles and above. Ask your Director if you need access.',
    };
  }
  if (DISPUTES_SECTIONS.has(section) && !flags.showDisputes) {
    return {
      title: 'Administrator access required',
      message:
        'Dispute resolution is limited to Administrator roles and above. Escalate open disputes to your Administrator or Director.',
    };
  }
  return null;
}

export function isStaffNavSectionAccessible(section: StaffSection, flags: StaffNavAccessFlags): boolean {
  return getStaffNavAccessNotice(section, flags) == null;
}

export interface StaffNavItemAccess {
  financeOnly?: boolean;
  settingsOnly?: boolean;
  citiesOnly?: boolean;
  disputesOnly?: boolean;
}

/** Hide nav items the current role cannot use (desktop already did this; mobile menu did not). */
export function isStaffNavItemVisible(
  item: StaffNavItemAccess,
  flags: StaffNavAccessFlags,
): boolean {
  if (item.financeOnly && !flags.showFinance) return false;
  if (item.settingsOnly && !flags.showSettings) return false;
  if (item.citiesOnly && !flags.showCities) return false;
  if (item.disputesOnly && !flags.showDisputes) return false;
  return true;
}

export const STAFF_SECTION_ACCESS_MESSAGES: Partial<Record<StaffSection, StaffNavAccessNotice>> = {
  messages: {
    title: 'Messages unavailable',
    message:
      'Messaging is not available for your account right now. Contact your Director if you need access.',
  },
  payments: {
    title: 'Payments',
    message:
      'Financial controls are limited to Director and Founder roles. If money is owed on jobs, ask your Director to review the Payments section.',
  },
  disputes: {
    title: 'Disputes',
    message:
      'Dispute resolution is limited to Administrator roles and above. Escalate open disputes to your Administrator or Director.',
  },
  'dev-updates': {
    title: 'Dev notes',
    message: 'Dev notes are available to Director and Founder accounts.',
  },
  'payment-settings': {
    title: 'Payment settings',
    message:
      'Payment method, platform fee, and crew pay settings are limited to Director and Founder roles. Ask your Director to review or update these controls.',
  },
  agreements: {
    title: 'Agreements',
    message: 'Agreement compliance is limited to Director and Founder roles.',
  },
  'audit-log': {
    title: 'Audit log',
    message: 'The platform audit log is limited to Director and Founder roles.',
  },
  settings: {
    title: 'Public Information',
    message:
      'Platform settings are limited to Administrator roles and above. Ask your Director to update approval rules, integrations, or other system-wide controls.',
  },
  cities: {
    title: 'Operations',
    message:
      'City rollout controls are limited to Manager roles and above. Directors assign which cities managers may manage.',
  },
  applications: {
    title: 'No access',
    message: 'Your role cannot review account applications.',
  },
  credentials: {
    title: 'No access',
    message: 'Your role cannot verify guard credentials.',
  },
};
