import type { SecurityGuard } from '../types';
import { formatServiceAreaLabel } from './californiaCities';
import type { GuardArmedPreference, GuardCardStatus } from '../types';

export type { GuardArmedPreference, GuardCardStatus };

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
