import type { Client, SecurityGuard } from '../types';
import { guardHasApplicationIntake } from './guardApplicationIntake';
import { isSelfSubmittedGuardAccount } from './approvalSubmissions';
import { getClientAccountStatus } from './accountStatus';

export const GUARD_APPLICATION_INTAKE_LOCKED_MESSAGE =
  'Application details are locked after submission. Staff must request an update before you can change them.';

export const CLIENT_APPLICATION_INTAKE_LOCKED_MESSAGE =
  'Application details are locked after submission. Staff must request an update before you can change them.';

/** Guard profile / resume fields that belong to the submitted application. */
export const GUARD_APPLICATION_INTAKE_FIELD_KEYS = [
  'name',
  'firstName',
  'middleName',
  'lastName',
  'phone',
  'bio',
  'summary',
  'serviceAreas',
  'specialties',
  'yearsExperience',
  'availabilityNotes',
  'hourlyRateRequirement',
  'listedWeaponGear',
  'isArmed',
] as const;

export type GuardApplicationIntakeFieldKey = (typeof GUARD_APPLICATION_INTAKE_FIELD_KEYS)[number];

/** Client contact fields captured with the application (intake-only fields have no post-signup editor yet). */
export const CLIENT_APPLICATION_CONTACT_FIELD_KEYS = [
  'name',
  'firstName',
  'middleName',
  'lastName',
  'phone',
  'companyName',
] as const;

export type ClientApplicationContactFieldKey = (typeof CLIENT_APPLICATION_CONTACT_FIELD_KEYS)[number];

export function isGuardApplicationRevisionOpen(
  guard: Pick<SecurityGuard, 'applicationRevisionRequestedAt'>
): boolean {
  return Boolean(guard.applicationRevisionRequestedAt);
}

export function isClientApplicationRevisionOpen(
  client: Pick<Client, 'applicationRevisionRequestedAt'>
): boolean {
  return Boolean(client.applicationRevisionRequestedAt);
}

/**
 * Application intake is frozen after submit unless staff requested a revision.
 * Staff-provisioned accounts with no intake yet may fill details once.
 */
export function isGuardApplicationIntakeLocked(
  guard: Pick<
    SecurityGuard,
    | 'isStaff'
    | 'mustChangePassword'
    | 'applicationRevisionRequestedAt'
    | 'yearsExperience'
    | 'specialties'
    | 'serviceAreas'
    | 'summary'
    | 'availabilityNotes'
    | 'guardCardStatus'
    | 'armedPreference'
    | 'hasReliableTransportation'
  >
): boolean {
  if (guard.isStaff) return false;
  if (isGuardApplicationRevisionOpen(guard)) return false;
  if (!guardHasApplicationIntake(guard as SecurityGuard) && guard.mustChangePassword) {
    return false;
  }
  return guardHasApplicationIntake(guard as SecurityGuard) || isSelfSubmittedGuardAccount(guard as SecurityGuard);
}

/**
 * Pending client applications stay frozen until staff requests revision.
 * Active clients may update contact fields (intake fields are not editable in the client profile UI).
 */
export function isClientApplicationContactLocked(
  client: Pick<Client, 'accountStatus' | 'approved' | 'applicationRevisionRequestedAt' | 'mustChangePassword'>
): boolean {
  if (isClientApplicationRevisionOpen(client)) return false;
  if (client.mustChangePassword) return false;
  return getClientAccountStatus(client) === 'pending';
}

function normalizeComparable(value: unknown): string {
  if (value == null) return '';
  if (Array.isArray(value)) return JSON.stringify([...value].map(String).sort());
  if (typeof value === 'boolean') return value ? '1' : '0';
  if (typeof value === 'number') return String(value);
  return String(value).trim();
}

function fieldChanged(before: unknown, after: unknown): boolean {
  return normalizeComparable(before) !== normalizeComparable(after);
}

export function guardApplicationIntakeChanges(
  previous: SecurityGuard,
  next: Partial<
    Pick<
      SecurityGuard,
      | 'name'
      | 'firstName'
      | 'middleName'
      | 'lastName'
      | 'phone'
      | 'bio'
      | 'summary'
      | 'serviceAreas'
      | 'specialties'
      | 'yearsExperience'
      | 'availabilityNotes'
      | 'hourlyRateRequirement'
      | 'listedWeaponGear'
      | 'isArmed'
    >
  >
): GuardApplicationIntakeFieldKey[] {
  const changed: GuardApplicationIntakeFieldKey[] = [];
  for (const key of GUARD_APPLICATION_INTAKE_FIELD_KEYS) {
    if (!(key in next) || next[key] === undefined) continue;
    if (fieldChanged(previous[key], next[key])) changed.push(key);
  }
  return changed;
}

export function assertGuardApplicationIntakeEditable(
  guard: SecurityGuard,
  next: Parameters<typeof guardApplicationIntakeChanges>[1],
  options?: { staffBypass?: boolean }
): void {
  if (options?.staffBypass) return;
  const changed = guardApplicationIntakeChanges(guard, next);
  if (changed.length === 0) return;
  if (isGuardApplicationIntakeLocked(guard)) {
    throw new Error(GUARD_APPLICATION_INTAKE_LOCKED_MESSAGE);
  }
}

export function clientApplicationContactChanges(
  previous: Client,
  next: Partial<Pick<Client, 'name' | 'firstName' | 'middleName' | 'lastName' | 'phone' | 'companyName'>>
): ClientApplicationContactFieldKey[] {
  const changed: ClientApplicationContactFieldKey[] = [];
  for (const key of CLIENT_APPLICATION_CONTACT_FIELD_KEYS) {
    if (!(key in next) || next[key] === undefined) continue;
    if (fieldChanged(previous[key], next[key])) changed.push(key);
  }
  return changed;
}

export function assertClientApplicationContactEditable(
  client: Client,
  next: Parameters<typeof clientApplicationContactChanges>[1],
  options?: { staffBypass?: boolean }
): void {
  if (options?.staffBypass) return;
  const changed = clientApplicationContactChanges(client, next);
  if (changed.length === 0) return;
  if (isClientApplicationContactLocked(client)) {
    throw new Error(CLIENT_APPLICATION_INTAKE_LOCKED_MESSAGE);
  }
}
