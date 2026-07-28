import type {
  ApplicationCredentialSnapshotEntry,
  ApplicationCredentialSnapshotKey,
  ApplicationCredentialSnapshotStatus,
  Certification,
  GovernmentIdDocumentType,
  GuardApplicationSubmissionSnapshot,
  GuardInsurancePolicy,
  SecurityGuard,
} from '../types';
import { certDisplayName, resolveCertCatalogId } from './certCatalog';
import { certHasDocumentProof } from './certImagePolicy';
import { getGuardCardCertifications } from './guardAccountActivation';
import { formatCoiSummaryLine, guardHasInsuranceSubmitted, resolveInsuranceStatus } from './guardInsurance';
import {
  formatIdSummaryLine,
  getGuardIdVerificationStatus,
  governmentIdDocumentTypeLabel,
} from './guardIdentityVerification';
import {
  isContinuingEducationCatalogId,
  isPtaUofCatalogId,
} from './guardQualification';
import { isGuardCardCert } from './guardLicenses';
import { getGuardUserStatus } from './accountStatus';

export type {
  ApplicationCredentialSnapshotEntry,
  ApplicationCredentialSnapshotKey,
  ApplicationCredentialSnapshotStatus,
  GuardApplicationSubmissionSnapshot,
};

export function emptyApplicationSubmissionSnapshot(): GuardApplicationSubmissionSnapshot {
  return { version: 1, credentials: {} };
}

export function parseApplicationSubmissionSnapshot(
  raw: unknown
): GuardApplicationSubmissionSnapshot | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const row = raw as Record<string, unknown>;
  if (row.version !== 1 && row.version !== '1') {
    // Accept empty {} from DB default without version.
    if (!('credentials' in row) && !('sealedAt' in row)) return undefined;
  }
  const credentialsRaw =
    row.credentials && typeof row.credentials === 'object'
      ? (row.credentials as Record<string, unknown>)
      : {};
  const credentials: GuardApplicationSubmissionSnapshot['credentials'] = {};
  for (const key of [
    'gov-id',
    'coi',
    'guard-card',
    'mandatory-training',
    'ce',
    'pta-uof',
    '32-hour',
  ] as const) {
    const entry = credentialsRaw[key];
    if (!entry || typeof entry !== 'object') continue;
    const e = entry as Record<string, unknown>;
    if (typeof e.capturedAt !== 'string' || typeof e.label !== 'string') continue;
    if (e.status !== 'submitted' && e.status !== 'verified') continue;
    credentials[key] = {
      capturedAt: e.capturedAt,
      label: e.label,
      status: e.status,
      summary: typeof e.summary === 'string' ? e.summary : undefined,
      documentUrl: typeof e.documentUrl === 'string' ? e.documentUrl : undefined,
      payload:
        e.payload && typeof e.payload === 'object'
          ? (e.payload as Record<string, unknown>)
          : {},
    };
  }
  const hasContent = Object.keys(credentials).length > 0 || typeof row.sealedAt === 'string';
  if (!hasContent && row.version !== 1 && row.version !== '1') return undefined;
  return {
    version: 1,
    sealedAt: typeof row.sealedAt === 'string' ? row.sealedAt : undefined,
    credentials,
  };
}

/** Application package is frozen after approval unless staff requested revision. */
export function isApplicationCredentialSnapshotSealed(
  guard: Pick<SecurityGuard, 'applicationSubmissionSnapshot' | 'applicationRevisionRequestedAt'>
): boolean {
  if (guard.applicationRevisionRequestedAt) return false;
  return Boolean(guard.applicationSubmissionSnapshot?.sealedAt);
}

export function canWriteApplicationCredentialSnapshotSlot(
  guard: Pick<
    SecurityGuard,
    'applicationSubmissionSnapshot' | 'applicationRevisionRequestedAt' | 'userStatus' | 'isStaff'
  >,
  key: ApplicationCredentialSnapshotKey,
  options?: { replaceExisting?: boolean }
): boolean {
  if (guard.isStaff) return false;
  if (isApplicationCredentialSnapshotSealed(guard)) return false;
  const existing = guard.applicationSubmissionSnapshot?.credentials?.[key];
  if (existing && !options?.replaceExisting && !guard.applicationRevisionRequestedAt) {
    return false;
  }
  const status = getGuardUserStatus(guard);
  return status === 'pending' || status === 'approved' || Boolean(guard.applicationRevisionRequestedAt);
}

function snapshotFromGovId(guard: SecurityGuard, at: string): ApplicationCredentialSnapshotEntry | null {
  const status = getGuardIdVerificationStatus(guard);
  if (status === 'not_submitted') return null;
  if (!guard.idFrontUrl?.trim()) return null;
  return {
    capturedAt: at,
    label: governmentIdDocumentTypeLabel(guard.idDocumentType),
    status: status === 'verified' ? 'verified' : 'submitted',
    summary: formatIdSummaryLine(guard),
    documentUrl: guard.idFrontUrl.trim(),
    payload: {
      idDocumentType: guard.idDocumentType,
      idLicenseClass: guard.idLicenseClass,
      idState: guard.idState,
      idNumber: guard.idNumber,
      idExpiryDate: guard.idExpiryDate,
      idFrontUrl: guard.idFrontUrl,
      idBackUrl: guard.idBackUrl,
      idSelfieUrl: guard.idSelfieUrl,
      idVerificationStatus: status,
    },
  };
}

function snapshotFromCoi(
  policy: GuardInsurancePolicy | undefined,
  at: string
): ApplicationCredentialSnapshotEntry | null {
  if (!policy || !policy.documentUrl?.trim()) return null;
  if (policy.status === 'not_submitted') return null;
  const status = resolveInsuranceStatus(policy);
  return {
    capturedAt: at,
    label: 'Certificate of Insurance',
    status: status === 'verified' ? 'verified' : 'submitted',
    summary: formatCoiSummaryLine(policy),
    documentUrl: policy.documentUrl.trim(),
    payload: {
      carrier: policy.carrier,
      policyNumber: policy.policyNumber,
      generalLiabilityLimit: policy.generalLiabilityLimit,
      effectiveDate: policy.effectiveDate,
      expiryDate: policy.expiryDate,
      documentUrl: policy.documentUrl,
      status,
    },
  };
}

function snapshotFromCert(cert: Certification, at: string): ApplicationCredentialSnapshotEntry | null {
  if (!certHasDocumentProof(cert)) return null;
  return {
    capturedAt: at,
    label: certDisplayName(cert),
    status: cert.status === 'verified' ? 'verified' : 'submitted',
    summary: `${cert.issuer} · #${cert.number}`,
    documentUrl: cert.imageUrl?.trim(),
    payload: {
      certId: cert.id,
      catalogId: resolveCertCatalogId(cert),
      name: cert.name,
      issuer: cert.issuer,
      number: cert.number,
      state: cert.state,
      issueDate: cert.issueDate,
      expiryDate: cert.expiryDate,
      imageUrl: cert.imageUrl,
      status: cert.status,
    },
  };
}

export function captureGovIdApplicationSnapshot(
  guard: SecurityGuard,
  at = new Date().toISOString()
): GuardApplicationSubmissionSnapshot | null {
  if (!canWriteApplicationCredentialSnapshotSlot(guard, 'gov-id')) return null;
  const entry = snapshotFromGovId(guard, at);
  if (!entry) return null;
  return mergeApplicationCredentialSnapshot(guard.applicationSubmissionSnapshot, 'gov-id', entry);
}

export function captureCoiApplicationSnapshot(
  guard: SecurityGuard,
  policy: GuardInsurancePolicy | undefined,
  at = new Date().toISOString()
): GuardApplicationSubmissionSnapshot | null {
  if (!canWriteApplicationCredentialSnapshotSlot(guard, 'coi')) return null;
  const entry = snapshotFromCoi(policy, at);
  if (!entry) return null;
  return mergeApplicationCredentialSnapshot(guard.applicationSubmissionSnapshot, 'coi', entry);
}

export function captureCertApplicationSnapshot(
  guard: SecurityGuard,
  cert: Certification,
  at = new Date().toISOString()
): GuardApplicationSubmissionSnapshot | null {
  const catalogId = resolveCertCatalogId(cert);
  let key: ApplicationCredentialSnapshotKey | null = null;
  if (isGuardCardCert(cert)) {
    key = 'guard-card';
  } else if (isPtaUofCatalogId(catalogId)) {
    key = 'mandatory-training';
  } else if (isContinuingEducationCatalogId(catalogId)) {
    key = 'ce';
  }
  if (!key) return null;
  if (!canWriteApplicationCredentialSnapshotSlot(guard, key)) return null;
  const entry = snapshotFromCert(cert, at);
  if (!entry) return null;
  return mergeApplicationCredentialSnapshot(guard.applicationSubmissionSnapshot, key, entry);
}

export function mergeApplicationCredentialSnapshot(
  current: GuardApplicationSubmissionSnapshot | undefined,
  key: ApplicationCredentialSnapshotKey,
  entry: ApplicationCredentialSnapshotEntry
): GuardApplicationSubmissionSnapshot {
  const base = current ?? emptyApplicationSubmissionSnapshot();
  return {
    version: 1,
    sealedAt: base.sealedAt,
    credentials: {
      ...base.credentials,
      [key]: entry,
    },
  };
}

/** Freeze whatever is on file for the application package at approval time. */
export function sealApplicationSubmissionSnapshot(
  guard: SecurityGuard,
  at = new Date().toISOString()
): GuardApplicationSubmissionSnapshot {
  let next = guard.applicationSubmissionSnapshot ?? emptyApplicationSubmissionSnapshot();

  const fill = (
    key: ApplicationCredentialSnapshotKey,
    entry: ApplicationCredentialSnapshotEntry | null
  ) => {
    if (!entry) return;
    if (next.credentials[key]) return;
    next = mergeApplicationCredentialSnapshot(next, key, entry);
  };

  fill('gov-id', snapshotFromGovId(guard, at));
  fill('coi', snapshotFromCoi(guard.insurancePolicy, at));

  const card = getGuardCardCertifications(guard).find((cert) => certHasDocumentProof(cert));
  if (card) fill('guard-card', snapshotFromCert(card, at));

  const mandatory = (guard.certifications ?? []).find(
    (cert) => isPtaUofCatalogId(resolveCertCatalogId(cert)) && certHasDocumentProof(cert)
  );
  if (mandatory) fill('mandatory-training', snapshotFromCert(mandatory, at));

  const ce = (guard.certifications ?? []).find(
    (cert) =>
      isContinuingEducationCatalogId(resolveCertCatalogId(cert)) && certHasDocumentProof(cert)
  );
  if (ce) fill('ce', snapshotFromCert(ce, at));

  return {
    ...next,
    sealedAt: at,
  };
}

/** Open the package again when staff requests application revision. */
export function unsealApplicationSubmissionSnapshot(
  current: GuardApplicationSubmissionSnapshot | undefined
): GuardApplicationSubmissionSnapshot {
  const base = current ?? emptyApplicationSubmissionSnapshot();
  return {
    version: 1,
    sealedAt: undefined,
    credentials: { ...base.credentials },
  };
}

export function getApplicationCredentialSnapshotEntry(
  guard: Pick<SecurityGuard, 'applicationSubmissionSnapshot'>,
  key: ApplicationCredentialSnapshotKey
): ApplicationCredentialSnapshotEntry | undefined {
  return guard.applicationSubmissionSnapshot?.credentials?.[key];
}

export type ApplicationSnapshotStepStatus = 'pending' | 'submitted' | 'verified';

export interface ApplicationSnapshotCredentialStep {
  key: ApplicationCredentialSnapshotKey;
  label: string;
  status: ApplicationSnapshotStepStatus;
  summary?: string;
  documentUrl?: string;
  capturedAt?: string;
  /** True when this came from the sealed/submitted application package. */
  fromSnapshot: boolean;
}

const STEP_LABELS: Record<ApplicationCredentialSnapshotKey, string> = {
  'gov-id': 'Government ID',
  coi: 'Certificate of Insurance',
  'guard-card': 'BSIS Guard Card',
  'mandatory-training': 'Mandatory training (PTA/UOF)',
  ce: 'Continued Education',
  'pta-uof': 'Mandatory training (PTA/UOF)',
  '32-hour': 'Continued Education',
};

/**
 * Applications checklist: prefer frozen snapshot slots so later live uploads
 * do not rewrite what staff decided against.
 */
export function getApplicationSnapshotCredentialSteps(
  guard: SecurityGuard
): ApplicationSnapshotCredentialStep[] {
  const keys: ApplicationCredentialSnapshotKey[] = [
    'gov-id',
    'coi',
    'guard-card',
    'mandatory-training',
    'ce',
  ];
  return keys.map((key) => {
    const snap =
      getApplicationCredentialSnapshotEntry(guard, key) ??
      (key === 'mandatory-training'
        ? getApplicationCredentialSnapshotEntry(guard, 'pta-uof') ??
          getApplicationCredentialSnapshotEntry(guard, '32-hour')
        : key === 'ce'
          ? getApplicationCredentialSnapshotEntry(guard, '32-hour')
          : undefined);
    if (snap) {
      return {
        key,
        label: STEP_LABELS[key],
        status: snap.status,
        summary: snap.summary,
        documentUrl: snap.documentUrl,
        capturedAt: snap.capturedAt,
        fromSnapshot: true,
      };
    }
    return {
      key,
      label: STEP_LABELS[key],
      status: 'pending',
      fromSnapshot: false,
    };
  });
}

export function applicationSnapshotHasAnyCredential(
  guard: Pick<SecurityGuard, 'applicationSubmissionSnapshot'>
): boolean {
  return Object.keys(guard.applicationSubmissionSnapshot?.credentials ?? {}).length > 0;
}

export function guardHasInsuranceOnApplicationSnapshot(
  guard: Pick<SecurityGuard, 'applicationSubmissionSnapshot' | 'insurancePolicy'>
): boolean {
  if (getApplicationCredentialSnapshotEntry(guard, 'coi')) return true;
  return guardHasInsuranceSubmitted(guard);
}

export type GovIdSnapshotPayload = {
  idDocumentType?: GovernmentIdDocumentType;
  idLicenseClass?: string;
  idState?: string;
  idNumber?: string;
  idExpiryDate?: string;
  idFrontUrl?: string;
  idBackUrl?: string;
  idSelfieUrl?: string;
  idVerificationStatus?: string;
};
