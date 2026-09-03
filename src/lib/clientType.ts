import type { Client, ClientType } from '../types';
import { customerDisplayFallback } from './audienceLabels';

export type { ClientType };

export const CLIENT_TYPES = ['personal', 'business', 'security-company'] as const;

export function isClientType(value: unknown): value is ClientType {
  return value === 'personal' || value === 'business' || value === 'security-company';
}

/** Existing clients without a stored type are treated as business. */
export function normalizeClientType(value: unknown): ClientType {
  if (value === 'personal') return 'personal';
  if (value === 'security-company') return 'security-company';
  return 'business';
}

/** Business and licensed security companies bill as organizations. */
export function isOrganizationClientType(value: unknown): boolean {
  const kind = normalizeClientType(value);
  return kind === 'business' || kind === 'security-company';
}

export function isSecurityCompanyClientType(value: unknown): boolean {
  return normalizeClientType(value) === 'security-company';
}

export function clientTypeLabel(kind: ClientType | undefined): string {
  const type = normalizeClientType(kind);
  if (type === 'personal') return 'Personal';
  if (type === 'security-company') return 'Security company';
  return 'Business';
}

type ClientNameFields = Pick<Client, 'name' | 'companyName' | 'clientType' | 'firstName'>;

/** Staff lists, approvals, and confirmations — the contracting party. */
export function clientDisplayName(client: ClientNameFields): string {
  if (normalizeClientType(client.clientType) === 'personal') {
    return client.name?.trim() || client.firstName?.trim() || customerDisplayFallback();
  }
  return client.companyName?.trim() || client.name?.trim() || customerDisplayFallback();
}

/** Client home greeting / workspace label. */
export function clientWorkspaceLabel(client: ClientNameFields): string {
  if (normalizeClientType(client.clientType) === 'personal') {
    return client.firstName?.trim() || client.name?.trim() || 'there';
  }
  return client.companyName?.trim() || client.name?.trim() || 'Your company';
}
