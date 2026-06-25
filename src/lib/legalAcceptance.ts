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

export function missingLegalDocuments(
  role: LegalUserRole,
  userId: string,
  accepted: Set<string>
): LegalPageId[] {
  return requiredLegalDocumentsForRole(role).filter((documentId) => {
    const version = CURRENT_LEGAL_VERSIONS[documentId];
    return !accepted.has(legalAcceptanceKey(userId, documentId, version));
  });
}

export function hasAcceptedAllRequiredLegal(
  role: LegalUserRole,
  userId: string,
  accepted: Set<string>
): boolean {
  return missingLegalDocuments(role, userId, accepted).length === 0;
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
