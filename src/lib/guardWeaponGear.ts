import type { SecurityGuard } from '../types';
import { guardHasGuardrVerifiedCredential } from './guardQualification';
import { isGuardProfileApproved } from './guardTrust';

/** Gear a guard may list on their profile when BSIS requirements are met. */
export type GuardWeaponGearId = 'flashlight' | 'oc-spray' | 'baton' | 'handcuffs' | 'taser' | 'firearm';

/** Client-visible armed status derived from authorized defensive weapons. */
export type GuardArmedDisplayLevel = 'unarmed' | 'light-armed' | 'armed';

export type GuardWeaponGearCategory = 'client-approved' | 'light-armed' | 'armed';

export interface GuardWeaponGearRule {
  id: GuardWeaponGearId;
  label: string;
  shortLabel: string;
  category: GuardWeaponGearCategory;
  /** Catalog credentials that must be Guardr-verified (guard card checked separately). */
  requiredCatalogIds: string[];
}

/** Defensive weapons that authorize a Light Armed profile status. */
export const LIGHT_ARMED_WEAPON_GEAR_IDS: GuardWeaponGearId[] = ['baton', 'oc-spray', 'taser'];

export const GUARD_ARMED_DISPLAY_LEVEL_LABELS: Record<GuardArmedDisplayLevel, string> = {
  unarmed: 'Unarmed',
  'light-armed': 'Light Armed',
  armed: 'Armed',
};

export const GUARD_ARMED_DISPLAY_LEVEL_DESCRIPTIONS: Record<GuardArmedDisplayLevel, string> = {
  unarmed: 'No defensive weapons authorized',
  'light-armed': 'Baton, pepper spray (OC), and/or TASER authorized',
  armed: 'Handgun authorized',
};

/** California BSIS credential requirements per carried weapon. */
export const GUARD_WEAPON_GEAR_RULES: GuardWeaponGearRule[] = [
  {
    id: 'flashlight',
    label: 'Flashlight',
    shortLabel: 'Flashlight',
    category: 'client-approved',
    requiredCatalogIds: [],
  },
  {
    id: 'oc-spray',
    label: 'Pepper Spray (OC / Chemical Agent)',
    shortLabel: 'OC Spray',
    category: 'light-armed',
    requiredCatalogIds: ['bsis-chemical-agent-training'],
  },
  {
    id: 'baton',
    label: 'Baton (Expandable/Straight)',
    shortLabel: 'Baton',
    category: 'light-armed',
    requiredCatalogIds: ['bsis-baton', 'bsis-baton-training'],
  },
  {
    id: 'handcuffs',
    label: 'Handcuffs',
    shortLabel: 'Handcuffs',
    category: 'client-approved',
    requiredCatalogIds: [],
  },
  {
    id: 'taser',
    label: 'TASER / Electronic Control Device (ECD)',
    shortLabel: 'TASER',
    category: 'light-armed',
    requiredCatalogIds: ['bsis-taser-training'],
  },
  {
    id: 'firearm',
    label: 'Firearm (Handgun)',
    shortLabel: 'Firearm',
    category: 'armed',
    requiredCatalogIds: ['bsis-exposed-firearm', 'bsis-firearms-training', 'bsis-firearms-qualification'],
  },
];

const RULE_BY_ID = new Map(GUARD_WEAPON_GEAR_RULES.map((rule) => [rule.id, rule]));

export function isGuardWeaponGearId(value: string): value is GuardWeaponGearId {
  return RULE_BY_ID.has(value as GuardWeaponGearId);
}

export function normalizeListedWeaponGear(values: string[] | undefined): GuardWeaponGearId[] {
  if (!values?.length) return [];
  const seen = new Set<GuardWeaponGearId>();
  const normalized: GuardWeaponGearId[] = [];
  for (const value of values) {
    if (!isGuardWeaponGearId(value) || seen.has(value)) continue;
    seen.add(value);
    normalized.push(value);
  }
  return normalized;
}

export function guardMeetsWeaponGearRequirements(
  guard: SecurityGuard,
  weaponId: GuardWeaponGearId,
  state = 'CA'
): boolean {
  const rule = RULE_BY_ID.get(weaponId);
  if (!rule) return false;
  if (!guardHasGuardrVerifiedCredential(guard, 'bsis-guard-card', state)) return false;
  return rule.requiredCatalogIds.every((catalogId) =>
    guardHasGuardrVerifiedCredential(guard, catalogId, state)
  );
}

export function getEligibleWeaponGear(guard: SecurityGuard, state = 'CA'): GuardWeaponGearRule[] {
  return GUARD_WEAPON_GEAR_RULES.filter((rule) => guardMeetsWeaponGearRequirements(guard, rule.id, state));
}

export function getClientVisibleListedWeaponGear(
  guard: SecurityGuard,
  state = 'CA'
): GuardWeaponGearRule[] {
  const listed = normalizeListedWeaponGear(guard.listedWeaponGear);
  const eligibleIds = new Set(getEligibleWeaponGear(guard, state).map((rule) => rule.id));
  return listed
    .filter((id) => eligibleIds.has(id))
    .map((id) => RULE_BY_ID.get(id)!)
    .filter(Boolean);
}

export function sanitizeListedWeaponGear(
  guard: SecurityGuard,
  requested: string[] | undefined,
  state = 'CA'
): GuardWeaponGearId[] {
  const eligibleIds = new Set(getEligibleWeaponGear(guard, state).map((rule) => rule.id));
  return normalizeListedWeaponGear(requested).filter((id) => eligibleIds.has(id));
}

export function guardListsFirearmOnProfile(guard: SecurityGuard, state = 'CA'): boolean {
  return getClientVisibleListedWeaponGear(guard, state).some((rule) => rule.id === 'firearm');
}

export function guardHasVerifiedGuardCard(guard: SecurityGuard, state = 'CA'): boolean {
  return guardHasGuardrVerifiedCredential(guard, 'bsis-guard-card', state);
}

/** True when profile is staff-approved and the guard has a verified BSIS guard card. */
export function shouldShowGuardArmedDisplayLevel(guard: SecurityGuard, state = 'CA'): boolean {
  return isGuardProfileApproved(guard) && guardHasVerifiedGuardCard(guard, state);
}

export function getGuardArmedDisplayLevel(guard: SecurityGuard, state = 'CA'): GuardArmedDisplayLevel {
  const visibleIds = getClientVisibleListedWeaponGear(guard, state).map((rule) => rule.id);
  if (visibleIds.includes('firearm')) return 'armed';
  if (visibleIds.some((id) => LIGHT_ARMED_WEAPON_GEAR_IDS.includes(id))) return 'light-armed';
  return 'unarmed';
}

export function guardArmedDisplayLevelLabel(level: GuardArmedDisplayLevel): string {
  return GUARD_ARMED_DISPLAY_LEVEL_LABELS[level];
}

export function guardArmedDisplayLevelTone(level: GuardArmedDisplayLevel): 'success' | 'warning' | 'danger' {
  switch (level) {
    case 'armed':
      return 'danger';
    case 'light-armed':
      return 'warning';
    default:
      return 'success';
  }
}

export function guardArmedDisplayLevelIndicator(level: GuardArmedDisplayLevel): string {
  switch (level) {
    case 'armed':
      return '🔴';
    case 'light-armed':
      return '🟡';
    default:
      return '🟢';
  }
}
