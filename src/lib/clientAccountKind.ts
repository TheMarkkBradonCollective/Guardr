import type { Client, ClientAccountKind } from '../types';

export type { ClientAccountKind };

export const CLIENT_ACCOUNT_KINDS = ['personal', 'business'] as const;

export function isClientAccountKind(value: unknown): value is ClientAccountKind {
  return value === 'personal' || value === 'business';
}

/** Existing clients without a stored kind are treated as business. */
export function normalizeClientAccountKind(value: unknown): ClientAccountKind {
  return value === 'personal' ? 'personal' : 'business';
}

export function clientAccountKindLabel(kind: ClientAccountKind | undefined): string {
  return normalizeClientAccountKind(kind) === 'personal' ? 'Personal' : 'Business';
}

type ClientNameFields = Pick<Client, 'name' | 'companyName' | 'accountKind' | 'firstName'>;

/** Staff lists, approvals, and confirmations. */
export function clientDisplayName(client: ClientNameFields): string {
  if (normalizeClientAccountKind(client.accountKind) === 'personal') {
    return client.name?.trim() || client.firstName?.trim() || 'Client';
  }
  return client.companyName?.trim() || client.name?.trim() || 'Client';
}

/** Client home greeting / workspace label. */
export function clientWorkspaceLabel(client: ClientNameFields): string {
  if (normalizeClientAccountKind(client.accountKind) === 'personal') {
    return client.firstName?.trim() || client.name?.trim() || 'there';
  }
  return client.companyName?.trim() || client.name?.trim() || 'Your company';
}
