import type { ClientType } from '../types';
import { normalizeClientType } from './clientType';

/**
 * Product modules per contracting party — each account type is its own lane,
 * not a flavor of a shared client app.
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
  | 'reporting'
  /** Licensed PPO — post open marketplace jobs when roster is short (Phase B+). */
  | 'overflow-marketplace'
  /** Company guard roster — independent contractors booked by the PPO (Phase B). */
  | 'roster-management'
  /** Live shift board between PPO and their guards — not Guardr staff dispatch (Phase C). */
  | 'shift-operations';

export const PERSONAL_CLIENT_CAPABILITIES: readonly ClientCapability[] = [
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

export const BUSINESS_CLIENT_CAPABILITIES: readonly ClientCapability[] = [
  ...PERSONAL_CLIENT_CAPABILITIES,
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

/** Security companies — ops platform for PPOs; not a clone of venue/business tools. */
export const SECURITY_COMPANY_CAPABILITIES: readonly ClientCapability[] = [
  'overflow-marketplace',
  'request-security',
  'one-time-schedule',
  'recurring-schedules',
  'manage-upcoming',
  'view-assigned-guards',
  'messaging',
  'invoices',
  'save-locations',
  'authorized-contacts',
  'multiple-sites',
  'multi-guard-requests',
  'staffing-coverage',
  'business-billing',
  'company-documents',
  'reporting',
  'roster-management',
  'shift-operations',
] as const;

export const CLIENT_CAPABILITIES_BY_TYPE: Record<ClientType, readonly ClientCapability[]> = {
  personal: PERSONAL_CLIENT_CAPABILITIES,
  business: BUSINESS_CLIENT_CAPABILITIES,
  'security-company': SECURITY_COMPANY_CAPABILITIES,
};

export function capabilitiesForClientType(
  clientOrType: ClientType | Pick<{ clientType?: ClientType }, 'clientType'> | undefined
): Set<ClientCapability> {
  const type =
    typeof clientOrType === 'string' || clientOrType == null
      ? normalizeClientType(clientOrType)
      : normalizeClientType(clientOrType.clientType);
  return new Set(CLIENT_CAPABILITIES_BY_TYPE[type]);
}

export const PERSONAL_MAX_GUARDS_PER_REQUEST = 4;
export const BUSINESS_MAX_GUARDS_PER_REQUEST = 50;
export const SECURITY_COMPANY_MAX_GUARDS_PER_REQUEST = 50;

export function maxGuardsPerRequestForType(type: ClientType): number {
  if (type === 'personal') return PERSONAL_MAX_GUARDS_PER_REQUEST;
  if (type === 'security-company') return SECURITY_COMPANY_MAX_GUARDS_PER_REQUEST;
  return BUSINESS_MAX_GUARDS_PER_REQUEST;
}

/** Views each product lane may open in the client shell. */
const BUSINESS_ONLY_VIEWS = new Set(['reports']);
const SECURITY_COMPANY_ONLY_VIEWS = new Set(['reports', 'roster', 'operations']);

export function isClientViewAllowedForType(view: string, type: ClientType): boolean {
  if (BUSINESS_ONLY_VIEWS.has(view) || SECURITY_COMPANY_ONLY_VIEWS.has(view)) {
    return capabilitiesForClientType(type).has('reporting');
  }
  if (view === 'roster' || view === 'operations') {
    const caps = capabilitiesForClientType(type);
    return caps.has('roster-management') || caps.has('shift-operations');
  }
  return true;
}
