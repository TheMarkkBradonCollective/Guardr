import type { Client, ClientType } from '../types';

export type { ClientType };

export const CLIENT_TYPES = ['personal', 'business'] as const;

export function isClientType(value: unknown): value is ClientType {
  return value === 'personal' || value === 'business';
}

/** Existing clients without a stored type are treated as business. */
export function normalizeClientType(value: unknown): ClientType {
  return value === 'personal' ? 'personal' : 'business';
}

export function clientTypeLabel(kind: ClientType | undefined): string {
  return normalizeClientType(kind) === 'personal' ? 'Personal' : 'Business';
}

type ClientNameFields = Pick<Client, 'name' | 'companyName' | 'clientType' | 'firstName'>;

/** Staff lists, approvals, and confirmations — the contracting party. */
export function clientDisplayName(client: ClientNameFields): string {
  if (normalizeClientType(client.clientType) === 'personal') {
    return client.name?.trim() || client.firstName?.trim() || 'Client';
  }
  return client.companyName?.trim() || client.name?.trim() || 'Client';
}

/** Client home greeting / workspace label. */
export function clientWorkspaceLabel(client: ClientNameFields): string {
  if (normalizeClientType(client.clientType) === 'personal') {
    return client.firstName?.trim() || client.name?.trim() || 'there';
  }
  return client.companyName?.trim() || client.name?.trim() || 'Your company';
}
