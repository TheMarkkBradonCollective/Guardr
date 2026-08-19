import type { Client, ClientCredential, ClientCredentialStatus, JobType } from '../types';
import { accountKindLabel } from './audienceLabels';
import { clientDisplayName, normalizeClientType } from './clientType';
import {
  catalogTypesForClientType,
  clientCredentialRequiredForJob,
  clientCredentialTypeById,
  resolveClientCredentialCatalog,
  type ClientCredentialRuleOverride,
  type ClientCredentialTypeDef,
} from './clientCredentialCatalog';

export type { ClientCredential, ClientCredentialStatus };

export const CLIENT_CREDENTIAL_STATUS_LABELS: Record<ClientCredentialStatus, string> = {
  not_submitted: 'Pending upload',
  pending: 'Pending review',
  verified: 'Verified',
  rejected: 'Rejected',
};

export function newClientCredentialId(): string {
  return `cc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isClientCredentialStatus(value: unknown): value is ClientCredentialStatus {
  return value === 'not_submitted' || value === 'pending' || value === 'verified' || value === 'rejected';
}

export function parseClientCredentials(value: unknown): ClientCredential[] {
  if (!Array.isArray(value)) return [];
  const credentials: ClientCredential[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const row = raw as Record<string, unknown>;
    const typeId = typeof row.typeId === 'string' ? row.typeId.trim() : '';
    if (!typeId || !clientCredentialTypeById(typeId)) continue;
    const id = typeof row.id === 'string' && row.id.trim() ? row.id.trim() : newClientCredentialId();
    credentials.push({
      id,
      typeId,
      status: isClientCredentialStatus(row.status) ? row.status : 'not_submitted',
      documentUrl: typeof row.documentUrl === 'string' && row.documentUrl.trim() ? row.documentUrl : undefined,
      expirationDate:
        typeof row.expirationDate === 'string' && row.expirationDate.trim() ? row.expirationDate.trim() : undefined,
      notes: typeof row.notes === 'string' && row.notes.trim() ? row.notes.trim() : undefined,
      submittedAt: typeof row.submittedAt === 'string' ? row.submittedAt : undefined,
      reviewedAt: typeof row.reviewedAt === 'string' ? row.reviewedAt : undefined,
      reviewedBy: typeof row.reviewedBy === 'string' ? row.reviewedBy : undefined,
      rejectionReason: typeof row.rejectionReason === 'string' ? row.rejectionReason : undefined,
    });
  }
  return credentials;
}

export function clientCredentialsOf(client: Pick<Client, 'credentials'> | undefined): ClientCredential[] {
  return client?.credentials ?? [];
}

export function clientCredentialForType(
  client: Pick<Client, 'credentials'> | undefined,
  typeId: string
): ClientCredential | undefined {
  return clientCredentialsOf(client).find((credential) => credential.typeId === typeId);
}

export function isClientCredentialExpired(credential: Pick<ClientCredential, 'expirationDate'>): boolean {
  if (!credential.expirationDate) return false;
  const expiry = new Date(credential.expirationDate);
  return !Number.isNaN(expiry.getTime()) && expiry < new Date();
}

export function clientCredentialIsVerified(credential: ClientCredential | undefined): boolean {
  if (!credential) return false;
  if (credential.status !== 'verified') return false;
  if (!credential.documentUrl?.trim()) return false;
  if (isClientCredentialExpired(credential)) return false;
  return true;
}

export function requiredClientCredentialTypes(
  client: Pick<Client, 'clientType'>,
  jobType: JobType | undefined,
  overrides?: ClientCredentialRuleOverride[]
): ClientCredentialTypeDef[] {
  return catalogTypesForClientType(client.clientType, overrides).filter((type) => {
    if (type.alwaysRequired) return true;
    if (!jobType) return false;
    return clientCredentialRequiredForJob(type, jobType);
  });
}

export function missingRequiredClientCredentials(
  client: Pick<Client, 'clientType' | 'credentials'>,
  jobType: JobType | undefined,
  overrides?: ClientCredentialRuleOverride[]
): ClientCredentialTypeDef[] {
  return requiredClientCredentialTypes(client, jobType, overrides).filter(
    (type) => !clientCredentialIsVerified(clientCredentialForType(client, type.id))
  );
}

export function clientJobCredentialBlocker(
  client: Pick<Client, 'clientType' | 'credentials' | 'name' | 'companyName' | 'firstName'>,
  jobType: JobType | undefined,
  overrides?: ClientCredentialRuleOverride[]
): string | null {
  const missing = missingRequiredClientCredentials(client, jobType, overrides);
  if (missing.length === 0) return null;
  const names = missing.map((type) => type.name).join(', ');
  return `Upload and verify required credentials before posting this job: ${names}.`;
}

export function alwaysRequiredClientCredentialTypes(
  client: Pick<Client, 'clientType'>,
  overrides?: ClientCredentialRuleOverride[]
): ClientCredentialTypeDef[] {
  return catalogTypesForClientType(client.clientType, overrides).filter((type) => type.alwaysRequired);
}

export type ClientCredentialFeedSlot = {
  type: ClientCredentialTypeDef;
  credential?: ClientCredential;
  required: boolean;
};

/** Always-required slots plus any credentials the client has actually uploaded. */
export function clientCredentialFeedSlots(
  client: Pick<Client, 'clientType' | 'credentials'>,
  overrides?: ClientCredentialRuleOverride[]
): ClientCredentialFeedSlot[] {
  const types = catalogTypesForClientType(client.clientType, overrides);
  const uploaded = clientCredentialsOf(client);
  const slots: ClientCredentialFeedSlot[] = [];
  const seen = new Set<string>();

  for (const type of types) {
    if (!type.alwaysRequired) continue;
    seen.add(type.id);
    slots.push({
      type,
      credential: clientCredentialForType(client, type.id),
      required: true,
    });
  }

  for (const credential of uploaded) {
    if (seen.has(credential.typeId)) continue;
    const type = types.find((entry) => entry.id === credential.typeId) ?? clientCredentialTypeById(credential.typeId);
    if (!type) continue;
    seen.add(credential.typeId);
    slots.push({
      type,
      credential,
      required: Boolean(type.alwaysRequired),
    });
  }

  return slots;
}

export function clientCredentialFeedItemId(clientId: string, typeId: string, credentialId?: string): string {
  if (credentialId) return `client-cred/${clientId}/${credentialId}`;
  return `client-slot/${clientId}/${typeId}`;
}

export function parseClientCredentialFeedItemId(
  itemId: string
): { clientId: string; typeId?: string; credentialId?: string } | null {
  const cred = itemId.match(/^client-cred\/(.+)\/(cc-.+)$/);
  if (cred) return { clientId: cred[1], credentialId: cred[2] };
  const slot = itemId.match(/^client-slot\/(.+)\/([^/]+)$/);
  if (slot) return { clientId: slot[1], typeId: slot[2] };
  return null;
}

export function isClientCredentialFeedItemId(itemId: string): boolean {
  return itemId.startsWith('client-cred/') || itemId.startsWith('client-slot/');
}

export function clientCredentialStatusLabel(credential: ClientCredential | undefined): string {
  if (!credential || !credential.documentUrl?.trim()) return CLIENT_CREDENTIAL_STATUS_LABELS.not_submitted;
  if (credential.status === 'verified' && isClientCredentialExpired(credential)) return 'Expired';
  return CLIENT_CREDENTIAL_STATUS_LABELS[credential.status];
}

export function upsertClientCredential(
  credentials: ClientCredential[],
  next: ClientCredential
): ClientCredential[] {
  const without = credentials.filter((credential) => credential.id !== next.id && credential.typeId !== next.typeId);
  return [...without, next];
}

export function replaceClientCredential(
  credentials: ClientCredential[],
  credentialId: string,
  patch: Partial<ClientCredential>
): ClientCredential[] {
  return credentials.map((credential) =>
    credential.id === credentialId ? { ...credential, ...patch } : credential
  );
}

export function submitClientCredentialUpload(input: {
  typeId: string;
  documentUrl: string;
  expirationDate?: string;
  notes?: string;
  existing?: ClientCredential;
}): ClientCredential {
  const now = new Date().toISOString();
  return {
    id: input.existing?.id ?? newClientCredentialId(),
    typeId: input.typeId,
    status: 'pending',
    documentUrl: input.documentUrl,
    expirationDate: input.expirationDate,
    notes: input.notes,
    submittedAt: now,
    reviewedAt: undefined,
    reviewedBy: undefined,
    rejectionReason: undefined,
  };
}

export function clientNameForCredentialFeed(
  client: Pick<Client, 'name' | 'companyName' | 'clientType' | 'firstName'>
): string {
  return clientDisplayName(client);
}

export function resolvedClientCredentialType(
  typeId: string,
  overrides?: ClientCredentialRuleOverride[]
): ClientCredentialTypeDef | undefined {
  return resolveClientCredentialCatalog(overrides).find((type) => type.id === typeId) ?? clientCredentialTypeById(typeId);
}

export function clientTypeLabelForCredential(clientType: Client['clientType']): string {
  return accountKindLabel(normalizeClientType(clientType));
}
