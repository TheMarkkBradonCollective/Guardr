import type { Client, SessionUser } from '../types';
import type { SecurityGuard } from '../types';
import { STAFF_HIRING_ACCOUNT_LABEL } from './audienceLabels';
import { findGuardProfileForUser } from './guardDirectory';
import type { LegalPageId } from './legalContent';
import { CURRENT_LEGAL_VERSIONS, requiredLegalDocumentsForRole } from './legalContent';

export type LegalUserRole = 'guard' | 'client' | 'staff';

export interface LegalAcceptanceRecord {
  id: string;
  userId: string;
  userRole: LegalUserRole;
  documentId: LegalPageId;
  documentVersion: string;
  acceptedAt: string;
}

export function legalAcceptanceKey(userId: string, documentId: LegalPageId, version: string): string {
  return `${userId}:${documentId}:${version}`;
}

export function indexLegalAcceptances(records: LegalAcceptanceRecord[]): Set<string> {
  const keys = new Set<string>();
  for (const record of records) {
    keys.add(legalAcceptanceKey(record.userId, record.documentId, record.documentVersion));
  }
  return keys;
}

/** Match a session user to the profile row id used for legal acceptance storage. */
export function resolveLegalAcceptanceUserId(
  user: Pick<SessionUser, 'id' | 'email' | 'role'>,
  guards: SecurityGuard[],
  clients: Client[]
): string {
  if (user.role === 'client') {
    const emailLower = user.email.toLowerCase();
    const client = clients.find((c) => c.id === user.id || c.email.toLowerCase() === emailLower);
    return client?.id ?? user.id;
  }
  return findGuardProfileForUser(user, guards)?.id ?? user.id;
}

/** All profile ids that may have stored acceptances for this session (handles legacy id mismatches). */
export function resolveLegalAcceptanceUserIds(
  user: Pick<SessionUser, 'id' | 'email' | 'role'>,
  guards: SecurityGuard[],
  clients: Client[]
): string[] {
  const ids = new Set<string>([user.id]);
  ids.add(resolveLegalAcceptanceUserId(user, guards, clients));
  return [...ids];
}

export function hasAcceptedLegalDocument(
  userIds: string[],
  documentId: LegalPageId,
  accepted: Set<string>
): boolean {
  for (const userId of userIds) {
    const prefix = `${userId}:${documentId}:`;
    for (const key of accepted) {
      if (key.startsWith(prefix)) return true;
    }
  }
  return false;
}

export function missingLegalDocuments(
  role: LegalUserRole,
  userIds: string[],
  accepted: Set<string>
): LegalPageId[] {
  return requiredLegalDocumentsForRole(role).filter(
    (documentId) => !hasAcceptedLegalDocument(userIds, documentId, accepted)
  );
}

export function hasAcceptedAllRequiredLegal(
  role: LegalUserRole,
  userIds: string[],
  accepted: Set<string>
): boolean {
  return missingLegalDocuments(role, userIds, accepted).length === 0;
}

export function legalAcceptanceFromRow(row: Record<string, unknown>): LegalAcceptanceRecord {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    userRole: row.user_role as LegalUserRole,
    documentId: row.document_id as LegalPageId,
    documentVersion: String(row.document_version),
    acceptedAt: String(row.accepted_at),
  };
}

export function legalAcceptanceToDbRow(input: {
  userId: string;
  userRole: LegalUserRole;
  documentId: LegalPageId;
  documentVersion: string;
  acceptedAt?: string;
}): Record<string, unknown> {
  return {
    user_id: input.userId,
    user_role: input.userRole,
    document_id: input.documentId,
    document_version: input.documentVersion,
    accepted_at: input.acceptedAt ?? new Date().toISOString(),
  };
}

export interface LegalComplianceUserRow {
  userId: string;
  name: string;
  email: string;
  role: LegalUserRole;
  roleLabel: string;
  documents: Partial<Record<LegalPageId, { version: string; acceptedAt: string }>>;
  complete: boolean;
}

function legalRoleForGuard(guard: SecurityGuard): LegalUserRole {
  return guard.isStaff ? 'staff' : 'guard';
}

function legalRoleLabel(role: LegalUserRole): string {
  if (role === 'client') return STAFF_HIRING_ACCOUNT_LABEL;
  if (role === 'staff') return 'Staff';
  return 'Guard';
}

function latestAcceptanceByDocument(
  userId: string,
  records: LegalAcceptanceRecord[]
): Partial<Record<LegalPageId, { version: string; acceptedAt: string }>> {
  const byDoc = new Map<LegalPageId, LegalAcceptanceRecord>();
  for (const record of records) {
    if (record.userId !== userId) continue;
    const existing = byDoc.get(record.documentId);
    if (!existing || record.acceptedAt > existing.acceptedAt) {
      byDoc.set(record.documentId, record);
    }
  }
  const out: Partial<Record<LegalPageId, { version: string; acceptedAt: string }>> = {};
  for (const [documentId, record] of byDoc) {
    out[documentId] = { version: record.documentVersion, acceptedAt: record.acceptedAt };
  }
  return out;
}

export function buildLegalComplianceReport(
  guards: SecurityGuard[],
  clients: Client[],
  records: LegalAcceptanceRecord[]
): LegalComplianceUserRow[] {
  const rows: LegalComplianceUserRow[] = [];

  for (const client of clients) {
    const role: LegalUserRole = 'client';
    const documents = latestAcceptanceByDocument(client.id, records);
    const required = requiredLegalDocumentsForRole(role);
    rows.push({
      userId: client.id,
      name: client.companyName?.trim() ? `${client.name} (${client.companyName})` : client.name,
      email: client.email,
      role,
      roleLabel: legalRoleLabel(role),
      documents,
      complete: required.every((documentId) => documents[documentId]),
    });
  }

  for (const guard of guards) {
    const role = legalRoleForGuard(guard);
    const documents = latestAcceptanceByDocument(guard.id, records);
    const required = requiredLegalDocumentsForRole(role);
    rows.push({
      userId: guard.id,
      name: guard.name,
      email: guard.email,
      role,
      roleLabel: guard.isStaff && guard.staffRole ? guard.staffRole : legalRoleLabel(role),
      documents,
      complete: required.every((documentId) => documents[documentId]),
    });
  }

  return rows.sort((a, b) => {
    if (a.complete !== b.complete) return a.complete ? 1 : -1;
    return a.name.localeCompare(b.name);
  });
}

export { CURRENT_LEGAL_VERSIONS };
