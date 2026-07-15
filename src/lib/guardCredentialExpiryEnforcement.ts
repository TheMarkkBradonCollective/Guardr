import type { Certification, GuardInsurancePolicy, SecurityGuard } from '../types';
import { getGuardUserStatus, isGuardUserStatusActive } from './accountStatus';
import { credentialRequiresExpiry, resolveCertCatalogId } from './certCatalog';
import { certHasPendingUpdate } from './certRevisionHistory';
import { prependCertRevision, snapshotCertRevision } from './certRevisionHistory';
import { getGuardCardCertifications, guardHasVerifiedGuardCard } from './guardAccountActivation';
import {
  getGuardIdVerificationStatus,
  isIdExpired,
} from './guardIdentityVerification';
import {
  guardHasValidInsurance,
  guardInsuranceSubmitted,
  isInsuranceExpired,
  resolveInsuranceStatus,
} from './guardInsurance';
import {
  guardHasExpiredGuardCard,
  guardHasExpiredIdOnFile,
  guardHasVerifiedIdForWork,
  isCertExpired,
} from './guardQualification';
import { buildAutoExpiryUpdateRequestReason } from './staffDocumentReview';

export type ExpiredCredentialKind = 'government_id' | 'coi' | 'cert';

export interface ExpiredCredentialEnforcementItem {
  kind: ExpiredCredentialKind;
  label: string;
  blocksWork: boolean;
  certId?: string;
}

export interface GuardExpiryEnforcementPatch {
  guard: SecurityGuard;
  certUpdates: Array<{ certId: string; cert: Certification }>;
  insurancePolicy?: GuardInsurancePolicy;
  notifications: Array<{ title: string; body: string }>;
  changed: boolean;
}

function verifiedCertIsExpired(cert: Certification): boolean {
  if (cert.status !== 'verified') return false;
  const catalogId = resolveCertCatalogId(cert);
  if (catalogId && credentialRequiresExpiry(catalogId)) {
    return isCertExpired(cert);
  }
  return Boolean(cert.expiryDate?.trim() && isCertExpired(cert));
}

function certNeedsAutoExpiryUpdate(cert: Certification): boolean {
  if (cert.status !== 'verified') return false;
  if (!verifiedCertIsExpired(cert)) return false;
  if (cert.updateRequestedAt || certHasPendingUpdate(cert)) return false;
  return true;
}

function guardCardCertNeedsAutoExpiryUpdate(guard: SecurityGuard, state = 'CA'): Certification | null {
  if (!guardHasExpiredGuardCard(guard, state)) return null;
  return (
    getGuardCardCertifications(guard).find(
      (cert) => cert.status === 'verified' && Boolean(cert.expiryDate?.trim()) && isCertExpired(cert)
    ) ?? null
  );
}

function supplementalExpiredCerts(guard: SecurityGuard): Certification[] {
  return (guard.certifications ?? []).filter((cert) => {
    if (!certNeedsAutoExpiryUpdate(cert)) return false;
    const catalogId = resolveCertCatalogId(cert);
    if (!catalogId || catalogId === 'bsis-guard-card') return false;
    return credentialRequiresExpiry(catalogId);
  });
}

export function listExpiredCredentialsForEnforcement(
  guard: SecurityGuard,
  state = 'CA'
): ExpiredCredentialEnforcementItem[] {
  if (guard.isStaff) return [];
  const items: ExpiredCredentialEnforcementItem[] = [];

  if (getGuardIdVerificationStatus(guard) === 'verified' && isIdExpired(guard)) {
    items.push({
      kind: 'government_id',
      label: 'Government ID',
      blocksWork: true,
    });
  }

  const policy = guard.insurancePolicy;
  if (
    policy &&
    guardInsuranceSubmitted(guard) &&
    resolveInsuranceStatus(policy) === 'expired' &&
    (policy.status === 'verified' || policy.status === 'expired')
  ) {
    items.push({
      kind: 'coi',
      label: 'Certificate of Insurance',
      blocksWork: true,
    });
  }

  const guardCardCert = guardCardCertNeedsAutoExpiryUpdate(guard, state);
  if (guardCardCert) {
    items.push({
      kind: 'cert',
      label: guardCardCert.name,
      blocksWork: true,
      certId: guardCardCert.id,
    });
  }

  for (const cert of supplementalExpiredCerts(guard)) {
    items.push({
      kind: 'cert',
      label: cert.name,
      blocksWork: false,
      certId: cert.id,
    });
  }

  return items;
}

export function guardExpiredRequiredWorkCredentialUnresolved(
  guard: SecurityGuard,
  state = 'CA'
): boolean {
  if (guard.isStaff) return false;

  if (guard.idUpdateRequestedAt && !guardHasVerifiedIdForWork(guard)) {
    return true;
  }
  if (getGuardIdVerificationStatus(guard) === 'verified' && isIdExpired(guard)) {
    return true;
  }

  const policy = guard.insurancePolicy;
  if (policy?.updateRequestedAt && !guardHasValidInsurance(guard)) {
    return true;
  }
  if (
    policy &&
    guardInsuranceSubmitted(guard) &&
    resolveInsuranceStatus(policy) === 'expired' &&
    !guardHasValidInsurance(guard)
  ) {
    return true;
  }

  if (guardHasExpiredGuardCard(guard, state) && !guardHasVerifiedGuardCard(guard, state)) {
    return true;
  }

  const pendingGuardCardUpdate = getGuardCardCertifications(guard).some(
    (cert) =>
      cert.status === 'verified' &&
      Boolean(cert.updateRequestedAt) &&
      Boolean(cert.expiryDate?.trim()) &&
      isCertExpired(cert)
  );
  if (pendingGuardCardUpdate && !guardHasVerifiedGuardCard(guard, state)) {
    return true;
  }

  return false;
}

function applyAutoCertExpiryUpdate(cert: Certification): Certification {
  const requestedAt = new Date().toISOString();
  const updateRequestNote = buildAutoExpiryUpdateRequestReason(cert.name, cert.expiryDate);
  return {
    ...cert,
    updateRequestedAt: requestedAt,
    updateRequestNote,
    revisionHistory: prependCertRevision(
      cert.revisionHistory,
      snapshotCertRevision(cert, 'update_requested', { note: updateRequestNote, recordedAt: requestedAt })
    ),
  };
}

function applyAutoIdExpiryUpdate(guard: SecurityGuard): SecurityGuard {
  const requestedAt = new Date().toISOString();
  return {
    ...guard,
    idUpdateRequestedAt: requestedAt,
    idUpdateRequestNote: buildAutoExpiryUpdateRequestReason('Government ID', guard.idExpiryDate),
  };
}

function applyAutoCoiExpiryUpdate(policy: GuardInsurancePolicy): GuardInsurancePolicy {
  const requestedAt = new Date().toISOString();
  return {
    ...policy,
    status: 'expired',
    updateRequestedAt: requestedAt,
    updateRequestNote: buildAutoExpiryUpdateRequestReason(
      'Certificate of Insurance',
      policy.expiryDate
    ),
  };
}

function buildExpiryNotification(
  item: ExpiredCredentialEnforcementItem,
  guard: SecurityGuard
): {
  title: string;
  body: string;
} {
  const title =
    item.blocksWork && isGuardUserStatusActive(guard)
      ? `${item.label} expired — account restricted`
      : `${item.label} expired — update required`;
  const body = item.blocksWork
    ? `${item.label} expired. Upload and verify a replacement to work jobs again. Your current verified copy stays on file until staff approves the update.`
    : `${item.label} expired. Upload an updated document when ready.`;
  return { title, body };
}

export function applyGuardCredentialExpiryRestriction(guard: SecurityGuard): SecurityGuard {
  if (guard.isStaff) return guard;
  const unresolved = guardExpiredRequiredWorkCredentialUnresolved(guard);
  const userStatus = getGuardUserStatus(guard);

  if (unresolved && userStatus === 'active') {
    return {
      ...guard,
      userStatus: 'approved',
      credentialExpiryRestricted: true,
    };
  }

  if (
    !unresolved &&
    guard.credentialExpiryRestricted &&
    userStatus === 'approved' &&
    guardMeetsExpiryRestrictionClearRequirements(guard)
  ) {
    return {
      ...guard,
      userStatus: 'active',
      credentialExpiryRestricted: false,
    };
  }

  return guard;
}

function guardMeetsExpiryRestrictionClearRequirements(guard: SecurityGuard): boolean {
  return !guardExpiredRequiredWorkCredentialUnresolved(guard);
}

export function applyGuardCredentialExpiryEnforcement(
  guard: SecurityGuard,
  state = 'CA'
): GuardExpiryEnforcementPatch {
  if (guard.isStaff) {
    return { guard, certUpdates: [], notifications: [], changed: false };
  }

  let nextGuard = { ...guard };
  const certUpdates: Array<{ certId: string; cert: Certification }> = [];
  const notifications: Array<{ title: string; body: string }> = [];
  let changed = false;

  const expiredItems = listExpiredCredentialsForEnforcement(nextGuard, state);

  if (
    getGuardIdVerificationStatus(nextGuard) === 'verified' &&
    isIdExpired(nextGuard) &&
    !nextGuard.idUpdateRequestedAt
  ) {
    nextGuard = applyAutoIdExpiryUpdate(nextGuard);
    changed = true;
    const item = expiredItems.find((entry) => entry.kind === 'government_id');
    if (item) notifications.push(buildExpiryNotification(item, nextGuard));
  }

  const policy = nextGuard.insurancePolicy;
  if (
    policy &&
    guardInsuranceSubmitted(nextGuard) &&
    isInsuranceExpired(policy) &&
    (policy.status === 'verified' || policy.status === 'expired') &&
    !policy.updateRequestedAt
  ) {
    nextGuard = {
      ...nextGuard,
      insurancePolicy: applyAutoCoiExpiryUpdate(policy),
    };
    changed = true;
    const item = expiredItems.find((entry) => entry.kind === 'coi');
    if (item) notifications.push(buildExpiryNotification(item, nextGuard));
  }

  const certsToUpdate = new Map<string, Certification>();
  const guardCardCert = guardCardCertNeedsAutoExpiryUpdate(nextGuard, state);
  if (guardCardCert && certNeedsAutoExpiryUpdate(guardCardCert)) {
    certsToUpdate.set(guardCardCert.id, applyAutoCertExpiryUpdate(guardCardCert));
  }
  for (const cert of supplementalExpiredCerts(nextGuard)) {
    if (!certsToUpdate.has(cert.id)) {
      certsToUpdate.set(cert.id, applyAutoCertExpiryUpdate(cert));
    }
  }

  if (certsToUpdate.size > 0) {
    const nextCertifications = (nextGuard.certifications ?? []).map((cert) => {
      const updated = certsToUpdate.get(cert.id);
      if (!updated) return cert;
      certUpdates.push({ certId: cert.id, cert: updated });
      return updated;
    });
    nextGuard = { ...nextGuard, certifications: nextCertifications };
    changed = true;
    for (const item of expiredItems) {
      if (item.kind === 'cert' && item.certId && certsToUpdate.has(item.certId)) {
        notifications.push(buildExpiryNotification(item, nextGuard));
      }
    }
  }

  const restricted = applyGuardCredentialExpiryRestriction(nextGuard);
  if (restricted !== nextGuard) {
    nextGuard = restricted;
    changed = true;
  }

  return { guard: nextGuard, certUpdates, insurancePolicy: nextGuard.insurancePolicy, notifications, changed };
}

export function processGuardCredentialExpiryBatch(
  guards: SecurityGuard[],
  state = 'CA'
): GuardExpiryEnforcementPatch[] {
  return guards.map((guard) => applyGuardCredentialExpiryEnforcement(guard, state));
}

export function syncGuardCredentialExpiryState(guard: SecurityGuard, state = 'CA'): SecurityGuard {
  return applyGuardCredentialExpiryEnforcement(guard, state).guard;
}

export function syncGuardCredentialRuntimeState(guard: SecurityGuard, state = 'CA'): SecurityGuard {
  return syncGuardCredentialExpiryState(guard, state);
}

export function guardHasExpiredIdUpdatePending(
  guard: Pick<SecurityGuard, 'idUpdateRequestedAt' | 'idVerificationStatus' | 'idExpiryDate'>
): boolean {
  return Boolean(guard.idUpdateRequestedAt) && guardHasExpiredIdOnFile(guard);
}

/** Shown in staff roster, guard dashboard, and approvals when expiry enforcement downgraded the account. */
export const GUARD_CREDENTIAL_RESTRICTED_LABEL = 'Restricted';

export function isGuardCredentialExpiryRestricted(
  guard: Pick<SecurityGuard, 'credentialExpiryRestricted' | 'isStaff'>
): boolean {
  return Boolean(!guard.isStaff && guard.credentialExpiryRestricted);
}

export function guardCredentialRestrictedDetail(
  guard: Pick<SecurityGuard, 'credentialExpiryRestricted' | 'isStaff'>
): string {
  return isGuardCredentialExpiryRestricted(guard)
    ? 'A required credential expired. Upload and verify an updated document to work jobs again.'
    : '';
}
