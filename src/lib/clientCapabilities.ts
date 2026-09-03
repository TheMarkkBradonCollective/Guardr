import type { Client, ClientType } from '../types';
import { isOrganizationClientType, normalizeClientType } from './clientType';

/**
 * One client system. Client type is account structure, not usage frequency.
 * Personal = individual customer who can request, rebook, and schedule ongoing coverage.
 * Business = organization with expanded site, staffing, and team management tools.
 * Security company = licensed PPO hiring marketplace guards (business-like ops tools).
 */
export type ClientCapability =
  | 'request-security'
  | 'one-time-schedule'
  | 'recurring-schedules'
  | 'rebook-service'
  | 'rehire-guard'
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
  | 'site-requirements'
  | 'site-rosters'
  | 'multi-guard-requests'
  | 'staffing-coverage'
  | 'business-billing'
  | 'company-documents'
  | 'reporting';

/** Both account types are repeat customers. Frequency is not gated by type. */
export const SHARED_CLIENT_CAPABILITIES: readonly ClientCapability[] = [
  'request-security',
  'one-time-schedule',
  'recurring-schedules',
  'rebook-service',
  'rehire-guard',
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
  'site-requirements',
  'site-rosters',
  'multi-guard-requests',
  'staffing-coverage',
  'business-billing',
  'company-documents',
  'reporting',
] as const;

/** Personal events stay a small team; bulk site staffing is a business management tool. */
export const PERSONAL_MAX_GUARDS_PER_REQUEST = 4;
export const BUSINESS_MAX_GUARDS_PER_REQUEST = 50;

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
  if (isOrganizationClientType(type)) {
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
  _clientOrType?: ClientType | Pick<Client, 'clientType'> | undefined
): number | null {
  return null;
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
  const isPersonal = type === 'personal';
  const items: { id: ClientOverflowNavId; label: string }[] = [
    { id: 'invoices', label: isPersonal ? 'Payments' : 'Billing' },
    { id: 'guards', label: 'Guards' },
    { id: 'locations', label: isPersonal ? 'Locations' : 'Sites' },
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
  const isPersonal = type === 'personal';
  const isSecurityCompany = type === 'security-company';
  const actions: { id: ClientHomeQuickActionId; label: string; sub: string }[] = [
    {
      id: 'request',
      label: isPersonal ? 'Request security' : isSecurityCompany ? 'Post overflow job' : 'Post job',
      sub: isPersonal ? 'Request another anytime' : isSecurityCompany ? 'Hire marketplace guards' : 'Open to guards',
    },
    {
      id: 'guards',
      label: isPersonal ? 'Rebook a guard' : 'Browse guards',
      sub: isPersonal ? 'Same guard or team again' : 'Resumes & licenses',
    },
    {
      id: 'locations',
      label: isPersonal ? 'Preferred locations' : 'Sites',
      sub: isPersonal ? 'Reuse saved places' : 'Locations & site notes',
    },
    {
      id: 'schedule',
      label: 'Schedule',
      sub: isPersonal ? 'One-time or recurring' : 'Plan ahead',
    },
  ];
  if (clientHasCapability(type, 'recurring-schedules')) {
    actions.push(
      type === 'personal'
        ? {
            id: 'recurring',
            label: 'Recurring security',
            sub: 'Weekly or ongoing coverage',
          }
        : {
            id: 'recurring',
            label: 'Multi-guard site',
            sub: 'Construction & events',
          }
    );
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
  const type = resolveType(clientOrType);
  if (type === 'personal') return '+ Request security';
  if (type === 'security-company') return '+ Post overflow job';
  return '+ Post a job';
}
