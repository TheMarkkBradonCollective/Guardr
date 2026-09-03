import type { Client, ClientType } from '../types';
import { normalizeClientType } from './clientType';
import {
  capabilitiesForClientType,
  isClientViewAllowedForType,
  maxGuardsPerRequestForType,
  type ClientCapability,
  PERSONAL_CLIENT_CAPABILITIES,
  BUSINESS_CLIENT_CAPABILITIES,
  SECURITY_COMPANY_CAPABILITIES,
  PERSONAL_MAX_GUARDS_PER_REQUEST,
  BUSINESS_MAX_GUARDS_PER_REQUEST,
  SECURITY_COMPANY_MAX_GUARDS_PER_REQUEST,
} from './clientProductModules';

export type { ClientCapability };
export {
  PERSONAL_CLIENT_CAPABILITIES,
  BUSINESS_CLIENT_CAPABILITIES,
  SECURITY_COMPANY_CAPABILITIES,
  PERSONAL_MAX_GUARDS_PER_REQUEST,
  BUSINESS_MAX_GUARDS_PER_REQUEST,
  SECURITY_COMPANY_MAX_GUARDS_PER_REQUEST,
};

/** @deprecated Use PERSONAL_CLIENT_CAPABILITIES — kept for tests migrating off business inheritance. */
export const SHARED_CLIENT_CAPABILITIES = PERSONAL_CLIENT_CAPABILITIES;

/** @deprecated Use BUSINESS_CLIENT_CAPABILITIES minus personal caps. */
export const BUSINESS_ONLY_CAPABILITIES = BUSINESS_CLIENT_CAPABILITIES.filter(
  (cap) => !PERSONAL_CLIENT_CAPABILITIES.includes(cap as (typeof PERSONAL_CLIENT_CAPABILITIES)[number])
) as ClientCapability[];

export type ClientOverflowNavId = 'invoices' | 'guards' | 'locations' | 'reports' | 'settings';

export type ClientHomeQuickActionId =
  | 'request'
  | 'schedule'
  | 'recurring'
  | 'reports'
  | 'guards'
  | 'locations';

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
  return capabilitiesForClientType(clientOrType);
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
  return maxGuardsPerRequestForType(resolveType(clientOrType));
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
  return isClientViewAllowedForType(view, resolveType(clientOrType));
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
  const isSecurityCompany = type === 'security-company';
  const items: { id: ClientOverflowNavId; label: string }[] = [
    { id: 'invoices', label: isPersonal ? 'Payments' : 'Billing' },
    { id: 'guards', label: isSecurityCompany ? 'Marketplace' : 'Guards' },
    { id: 'locations', label: isPersonal ? 'Locations' : isSecurityCompany ? 'Client sites' : 'Sites' },
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
      label: isPersonal ? 'Rebook a guard' : isSecurityCompany ? 'Browse marketplace' : 'Browse guards',
      sub: isPersonal ? 'Same guard or team again' : 'Resumes & licenses',
    },
    {
      id: 'locations',
      label: isPersonal ? 'Preferred locations' : isSecurityCompany ? 'Client sites' : 'Sites',
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
      isPersonal
        ? {
            id: 'recurring',
            label: 'Recurring security',
            sub: 'Weekly or ongoing coverage',
          }
        : isSecurityCompany
          ? {
              id: 'recurring',
              label: 'Recurring posts',
              sub: 'Standing posts & routes',
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
