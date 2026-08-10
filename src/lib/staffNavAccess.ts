import type { StaffSection } from './staffOps';

export interface StaffNavAccessFlags {
  showFinance: boolean;
  showPayments: boolean;
  showSettings: boolean;
  showPermissions: boolean;
  showDisputes: boolean;
  showCities: boolean;
}

export interface StaffNavAccessNotice {
  title: string;
  message: string;
}

const FINANCE_SECTIONS = new Set<StaffSection>([
  'payment-settings',
  'agreements',
  'audit-log',
  'dev-updates',
]);

const PAYMENTS_SECTIONS = new Set<StaffSection>(['payments']);

const PERMISSIONS_SECTIONS = new Set<StaffSection>(['permissions']);
const CITIES_SECTIONS = new Set<StaffSection>(['cities']);
const DISPUTES_SECTIONS = new Set<StaffSection>(['disputes']);

export function getStaffNavAccessNotice(
  section: StaffSection,
  flags: StaffNavAccessFlags,
): StaffNavAccessNotice | null {
  if (PAYMENTS_SECTIONS.has(section) && !flags.showPayments) {
    return {
      title: 'Payments',
      message: 'Payments are available to staff with finance permissions.',
    };
  }
  if (FINANCE_SECTIONS.has(section) && !flags.showFinance) {
    return {
      title: 'Finance access required',
      message:
        'Financial controls, payment settings, agreements, audit log, and dev notes require finance permissions. Ask your Director if you need access.',
    };
  }
  if (PERMISSIONS_SECTIONS.has(section) && !flags.showPermissions) {
    return {
      title: 'Manager access required',
      message:
        'Staff role permissions are limited to Manager roles and above. Ask your Director if you need access.',
    };
  }
  if (CITIES_SECTIONS.has(section) && !flags.showCities) {
    return {
      title: 'Manager access required',
      message:
        'Service Areas controls are limited to Manager roles and above. Ask your Director if you need access.',
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
  paymentsOnly?: boolean;
  settingsOnly?: boolean;
  permissionsOnly?: boolean;
  citiesOnly?: boolean;
  disputesOnly?: boolean;
}

/** Hide nav items the current role cannot use (desktop already did this; mobile menu did not). */
export function isStaffNavItemVisible(
  item: StaffNavItemAccess,
  flags: StaffNavAccessFlags,
): boolean {
  if (item.financeOnly && !flags.showFinance) return false;
  if (item.paymentsOnly && !flags.showPayments) return false;
  if (item.settingsOnly && !flags.showSettings) return false;
  if (item.permissionsOnly && !flags.showPermissions) return false;
  if (item.citiesOnly && !flags.showCities) return false;
  if (item.disputesOnly && !flags.showDisputes) return false;
  return true;
}

export const STAFF_SECTION_ACCESS_MESSAGES: Partial<Record<StaffSection, StaffNavAccessNotice>> = {
  payments: {
    title: 'Payments',
    message: 'Payments are available to staff with finance permissions.',
  },
  disputes: {
    title: 'Disputes',
    message:
      'Dispute resolution is limited to staff with the Handle disputes permission. Escalate open disputes to your Administrator or Director.',
  },
  'dev-updates': {
    title: 'Dev notes',
    message: 'Dev notes require finance permissions (Manager defaults and above).',
  },
  'payment-settings': {
    title: 'Payment settings',
    message:
      'Platform fee and crew pay settings require finance permissions. Ask your Director to review or update these controls.',
  },
  agreements: {
    title: 'Agreements',
    message: 'Agreement compliance requires finance permissions (Manager defaults and above).',
  },
  'audit-log': {
    title: 'Audit log',
    message: 'The platform audit log requires the Access audit log permission.',
  },
  settings: {
    title: 'Public Information',
    message:
      'Public information is viewable by all staff. Roles with Manage public information can update the company placard and other platform content.',
  },
  integrations: {
    title: 'Integrations',
    message:
      'Integrations are viewable by all staff. Roles with Manage integrations can change payment, SMS, and verification settings.',
  },
  permissions: {
    title: 'Permissions',
    message:
      'Staff permissions and approval rules are limited to Manager roles and above. Ask your Director if you need access.',
  },
  cities: {
    title: 'Service Areas',
    message:
      'Service Areas controls require View Service Areas & recommend cities. Directors assign which cities managers may manage.',
  },
  locations: {
    title: 'Locations',
    message:
      'Location quality control requires Manage shared locations or Review job postings. Ask your Administrator if you need access.',
  },
  messages: {
    title: 'Messages unavailable',
    message:
      'Messaging requires Access job & staff messages (or Handle support messages for the support inbox). Contact your Director if you need access.',
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
