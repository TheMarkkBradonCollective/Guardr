import type { Client, ClientType } from '../types';
import { normalizeClientType } from './clientType';

/**
 * One client system. Client type unlocks extra tools — Personal stays simple,
 * Business adds site, staffing, and reporting capabilities.
 */
export type ClientCapability =
  | 'request-security'
  | 'one-time-schedule'
  | 'manage-upcoming'
  | 'view-assigned-guards'
  | 'messaging'
  | 'invoices'
  | 'save-locations'
  | 'authorized-contacts'
  | 'personal-protection'
  | 'multiple-sites'
  | 'multiple-users'
  | 'employee-access'
  | 'recurring-schedules'
  | 'site-requirements'
  | 'site-rosters'
  | 'multi-guard-requests'
  | 'staffing-coverage'
  | 'business-billing'
  | 'company-documents'
  | 'reporting';

export const SHARED_CLIENT_CAPABILITIES: readonly ClientCapability[] = [
  'request-security',
  'one-time-schedule',
  'manage-upcoming',
  'view-assigned-guards',
  'messaging',
  'invoices',
  'save-locations',
  'authorized-contacts',
  'personal-protection',
] as const;

export const BUSINESS_ONLY_CAPABILITIES: readonly ClientCapability[] = [
  'multiple-sites',
  'multiple-users',
  'employee-access',
  'recurring-schedules',
  'site-requirements',
  'site-rosters',
  'multi-guard-requests',
  'staffing-coverage',
  'business-billing',
  'company-documents',
  'reporting',
] as const;

/** Personal one-time jobs can still cover a small event; bulk site staffing is business. */
export const PERSONAL_MAX_GUARDS_PER_REQUEST = 4;
export const BUSINESS_MAX_GUARDS_PER_REQUEST = 50;
export const PERSONAL_MAX_SAVED_LOCATIONS = 8;

export type ClientOverflowNavId = 'invoices' | 'guards' | 'locations' | 'reports' | 'settings';

export type ClientHomeQuickActionId =
  | 'request'
  | 'schedule'
  | 'recurring'
  | 'reports'
  | 'guards'
  | 'locations';

const BUSINESS_ONLY_VIEWS = new Set(['reports']);

function resolveType(
  clientOrType: ClientType | Pick<Client, 'clientType'> | undefined
): ClientType {
  if (typeof clientOrType === 'string' || clientOrType == null) {
    return normalizeClientType(clientOrType);
  }
  return normalizeClientType(clientOrType.clientType);
}

export function clientCapabilities(
  clientOrType: ClientType | Pick<Client, 'clientType'> | undefined
): Set<ClientCapability> {
  const type = resolveType(clientOrType);
  const caps = new Set<ClientCapability>(SHARED_CLIENT_CAPABILITIES);
  if (type === 'business') {
    for (const cap of BUSINESS_ONLY_CAPABILITIES) caps.add(cap);
  }
  return caps;
}

export function clientHasCapability(
  clientOrType: ClientType | Pick<Client, 'clientType'> | undefined,
  capability: ClientCapability
): boolean {
  return clientCapabilities(clientOrType).has(capability);
}

export function clientMaxGuardsPerRequest(
  clientOrType: ClientType | Pick<Client, 'clientType'> | undefined
): number {
  return clientHasCapability(clientOrType, 'multi-guard-requests')
    ? BUSINESS_MAX_GUARDS_PER_REQUEST
    : PERSONAL_MAX_GUARDS_PER_REQUEST;
}

export function clientMaxSavedLocations(
  clientOrType: ClientType | Pick<Client, 'clientType'> | undefined
): number | null {
  return clientHasCapability(clientOrType, 'multiple-sites') ? null : PERSONAL_MAX_SAVED_LOCATIONS;
}

export function clampClientGuardsNeeded(
  count: number,
  clientOrType: ClientType | Pick<Client, 'clientType'> | undefined,
  existingCount?: number
): number {
  const max = Math.max(clientMaxGuardsPerRequest(clientOrType), existingCount ?? 1);
  const n = Number.isFinite(count) ? count : 1;
  return Math.min(max, Math.max(1, Math.round(n)));
}

export function isClientViewAllowed(
  view: string,
  clientOrType: ClientType | Pick<Client, 'clientType'> | undefined
): boolean {
  if (!BUSINESS_ONLY_VIEWS.has(view)) return true;
  return clientHasCapability(clientOrType, 'reporting');
}

export function resolveAllowedClientView(
  view: string,
  clientOrType: ClientType | Pick<Client, 'clientType'> | undefined
): string {
  return isClientViewAllowed(view, clientOrType) ? view : 'home';
}

export function clientOverflowNav(
  clientOrType: ClientType | Pick<Client, 'clientType'> | undefined
): { id: ClientOverflowNavId; label: string }[] {
  const type = resolveType(clientOrType);
  const items: { id: ClientOverflowNavId; label: string }[] = [
    { id: 'invoices', label: type === 'personal' ? 'Payments' : 'Billing' },
    { id: 'guards', label: 'Guards' },
    { id: 'locations', label: type === 'personal' ? 'Locations' : 'Sites' },
  ];
  if (clientHasCapability(type, 'reporting')) {
    items.push({ id: 'reports', label: 'Reports' });
  }
  items.push({ id: 'settings', label: 'Settings' });
  return items;
}

export function clientHomeQuickActions(
  clientOrType: ClientType | Pick<Client, 'clientType'> | undefined
): { id: ClientHomeQuickActionId; label: string; sub: string }[] {
  const type = resolveType(clientOrType);
  const actions: { id: ClientHomeQuickActionId; label: string; sub: string }[] = [
    {
      id: 'request',
      label: type === 'personal' ? 'Request security' : 'Post job',
      sub: type === 'personal' ? 'One-time coverage' : 'Open to guards',
    },
    {
      id: 'guards',
      label: type === 'personal' ? 'Assigned guards' : 'Browse guards',
      sub: type === 'personal' ? "Who's covering you" : 'Resumes & licenses',
    },
    {
      id: 'locations',
      label: type === 'personal' ? 'My places' : 'Sites',
      sub: type === 'personal' ? 'Saved personal locations' : 'Locations & site notes',
    },
    {
      id: 'schedule',
      label: 'Schedule',
      sub: type === 'personal' ? 'Plan a one-time service' : 'Plan ahead',
    },
  ];
  if (clientHasCapability(type, 'multi-guard-requests')) {
    actions.push({
      id: 'recurring',
      label: 'Multi-guard site',
      sub: 'Construction & events',
    });
  }
  if (clientHasCapability(type, 'reporting')) {
    actions.push({
      id: 'reports',
      label: 'Reports',
      sub: 'Activity & incidents',
    });
  }
  return actions;
}

export function clientPostJobLabel(
  clientOrType: ClientType | Pick<Client, 'clientType'> | undefined
): string {
  return resolveType(clientOrType) === 'personal' ? '+ Request security' : '+ Post a job';
}
