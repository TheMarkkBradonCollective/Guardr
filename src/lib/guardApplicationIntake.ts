import type { SecurityGuard } from '../types';
import { formatServiceAreaLabel } from './californiaCities';
import type { GuardArmedPreference, GuardCardStatus } from '../types';
import { certDisplayName } from './certCatalog';
import { getGuardIdVerificationStatus, ID_VERIFICATION_STATUS_LABELS } from './guardIdentityVerification';
import { formatCoiSummaryLine } from './guardInsurance';

export type { GuardArmedPreference, GuardCardStatus };

export type UploadedCredentialTone = 'pending' | 'approved' | 'denied' | 'default';

export interface GuardUploadedCredentialRow {
  key: string;
  label: string;
  statusLabel: string;
  tone: UploadedCredentialTone;
}

function credentialTone(
  status: 'pending' | 'verified' | 'rejected' | 'approved' | 'denied' | 'expired'
): UploadedCredentialTone {
  if (status === 'pending') return 'pending';
  if (status === 'verified' || status === 'approved') return 'approved';
  if (status === 'rejected' || status === 'denied' || status === 'expired') return 'denied';
  return 'default';
}

export function listGuardUploadedCredentials(guard: SecurityGuard): GuardUploadedCredentialRow[] {
  const rows: GuardUploadedCredentialRow[] = [];
  const idStatus = getGuardIdVerificationStatus(guard);
  if (idStatus !== 'not_submitted') {
    rows.push({
      key: 'gov-id',
      label: 'Government ID',
      statusLabel: ID_VERIFICATION_STATUS_LABELS[idStatus],
      tone: credentialTone(idStatus === 'verified' ? 'verified' : idStatus),
    });
  }

  const policy = guard.insurancePolicy;
  if (policy && policy.status !== 'not_submitted') {
    rows.push({
      key: 'coi',
      label: 'Certificate of Insurance',
      statusLabel:
        policy.status === 'verified'
          ? 'Verified'
          : policy.status === 'rejected'
            ? 'Rejected'
            : 'Pending review',
      tone: credentialTone(policy.status === 'verified' ? 'verified' : policy.status),
    });
  }

  for (const cert of guard.certifications) {
    if (!cert.imageUrl && cert.status === 'pending') continue;
    if (cert.status === 'rejected' && !cert.imageUrl) continue;
    rows.push({
      key: cert.id,
      label: certDisplayName(cert),
      statusLabel:
        cert.status === 'verified'
          ? 'Verified'
          : cert.status === 'rejected'
            ? 'Rejected'
            : 'Pending review',
      tone: credentialTone(cert.status),
    });
  }

  return rows;
}

export const GUARD_CARD_STATUS_OPTIONS: { value: GuardCardStatus; label: string }[] = [
  { value: 'active', label: 'Active CA guard card on hand' },
  { value: 'in_progress', label: 'In progress / exam scheduled' },
  { value: 'none', label: 'Not yet — plan to obtain' },
];

export function guardCardStatusLabel(status?: GuardCardStatus): string | undefined {
  return GUARD_CARD_STATUS_OPTIONS.find((o) => o.value === status)?.label;
}

export function guardArmedPreferenceLabel(guard: SecurityGuard): string {
  if (guard.armedPreference === 'both') return 'Armed & unarmed';
  if (guard.armedPreference === 'armed') return 'Armed';
  if (guard.armedPreference === 'unarmed') return 'Unarmed';
  return guard.isArmed ? 'Armed' : 'Unarmed';
}

export function guardArmedPreferenceFromSignup(preference: GuardArmedPreference): {
  isArmed: boolean;
  armedPreference: GuardArmedPreference;
} {
  return {
    isArmed: preference !== 'unarmed',
    armedPreference: preference,
  };
}

export function formatGuardServiceAreasList(areas?: string[]): string | undefined {
  if (!areas?.length) return undefined;
  return areas.map((area) => formatServiceAreaLabel(area)).join(', ');
}

export function guardHasApplicationIntake(guard: SecurityGuard): boolean {
  return Boolean(
    guard.yearsExperience != null ||
      guard.specialties?.length ||
      guard.serviceAreas?.length ||
      guard.summary?.trim() ||
      guard.availabilityNotes?.trim() ||
      guard.guardCardStatus ||
      guard.armedPreference ||
      guard.hasReliableTransportation != null
  );
}
