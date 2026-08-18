import type {
  ClientAuthorizedContact,
  ClientAuthorizedContactRole,
  ClientType,
} from '../types';
import { normalizeClientType } from './clientType';

export const PERSONAL_CONTACT_ROLES: { id: ClientAuthorizedContactRole; label: string }[] = [
  { id: 'family', label: 'Family' },
  { id: 'emergency', label: 'Emergency' },
  { id: 'contact', label: 'Authorized contact' },
];

export const BUSINESS_CONTACT_ROLES: { id: ClientAuthorizedContactRole; label: string }[] = [
  { id: 'owner', label: 'Owner' },
  { id: 'manager', label: 'Manager' },
  { id: 'employee', label: 'Employee' },
  { id: 'contact', label: 'Site contact' },
];

const ALL_ROLES = new Set<ClientAuthorizedContactRole>([
  ...PERSONAL_CONTACT_ROLES.map((r) => r.id),
  ...BUSINESS_CONTACT_ROLES.map((r) => r.id),
]);

export function contactRolesForClientType(
  clientType: ClientType | undefined
): { id: ClientAuthorizedContactRole; label: string }[] {
  return normalizeClientType(clientType) === 'personal' ? PERSONAL_CONTACT_ROLES : BUSINESS_CONTACT_ROLES;
}

export function contactRoleLabel(
  role: ClientAuthorizedContactRole | undefined,
  clientType?: ClientType
): string {
  const options = contactRolesForClientType(clientType);
  return options.find((r) => r.id === role)?.label ?? 'Contact';
}

function isContactRole(value: unknown): value is ClientAuthorizedContactRole {
  return typeof value === 'string' && ALL_ROLES.has(value as ClientAuthorizedContactRole);
}

export function newAuthorizedContactDraft(
  input: Partial<ClientAuthorizedContact> = {}
): ClientAuthorizedContact {
  return {
    id: input.id?.trim() || `ac-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name?.trim() ?? '',
    phone: input.phone?.trim() || undefined,
    email: input.email?.trim() || undefined,
    role: isContactRole(input.role) ? input.role : 'contact',
    notes: input.notes?.trim() || undefined,
  };
}

export function parseAuthorizedContacts(value: unknown): ClientAuthorizedContact[] {
  if (!Array.isArray(value)) return [];
  const contacts: ClientAuthorizedContact[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const row = raw as Record<string, unknown>;
    const name = typeof row.name === 'string' ? row.name.trim() : '';
    if (!name) continue;
    contacts.push(
      newAuthorizedContactDraft({
        id: typeof row.id === 'string' ? row.id : undefined,
        name,
        phone: typeof row.phone === 'string' ? row.phone : undefined,
        email: typeof row.email === 'string' ? row.email : undefined,
        role: isContactRole(row.role) ? row.role : 'contact',
        notes: typeof row.notes === 'string' ? row.notes : undefined,
      })
    );
  }
  return contacts;
}
