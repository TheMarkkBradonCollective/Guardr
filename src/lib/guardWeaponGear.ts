import type { SecurityGuard } from '../types';
import { guardHasGuardrVerifiedCredential } from './guardQualification';

/** Gear a guard may list on their profile when BSIS requirements are met. */
export type GuardWeaponGearId = 'flashlight' | 'oc-spray' | 'baton' | 'handcuffs' | 'taser' | 'firearm';

export type GuardWeaponGearCategory = 'client-approved' | 'light-armed' | 'armed';

export const GUARD_WEAPON_GEAR_CATEGORY_ORDER: GuardWeaponGearCategory[] = [
  'client-approved',
  'light-armed',
  'armed',
];

export const GUARD_WEAPON_GEAR_CATEGORY_LABELS: Record<GuardWeaponGearCategory, string> = {
  'client-approved': 'Unarmed',
  'light-armed': 'Light armed',
  armed: 'Armed',
};

export const GUARD_WEAPON_GEAR_CATEGORY_DESCRIPTIONS: Record<GuardWeaponGearCategory, string> = {
  'client-approved': 'Standard duty gear — verified guard card only.',
  'light-armed': 'Less-lethal weapons — verified BSIS permits and training required.',
  armed: 'Firearm carry — verified exposed firearm permit and firearms training required.',
};

export interface GuardWeaponGearRule {
  id: GuardWeaponGearId;
  label: string;
  shortLabel: string;
  category: GuardWeaponGearCategory;
  /** Catalog credentials that must be Guardr-verified (guard card checked separately). */
  requiredCatalogIds: string[];
}

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

/** Catalog credentials still needed before a guard can list this gear (includes guard card). */
export function getMissingWeaponGearCatalogIds(
  guard: SecurityGuard,
  weaponId: GuardWeaponGearId,
  state = 'CA'
): string[] {
  const rule = RULE_BY_ID.get(weaponId);
  if (!rule) return [];
  const missing: string[] = [];
  if (!guardHasGuardrVerifiedCredential(guard, 'bsis-guard-card', state)) {
    missing.push('bsis-guard-card');
  }
  for (const catalogId of rule.requiredCatalogIds) {
    if (!guardHasGuardrVerifiedCredential(guard, catalogId, state)) {
      missing.push(catalogId);
    }
  }
  return missing;
}

/** All catalog credentials required to list this gear (guard card + weapon-specific). */
export function getWeaponGearRequiredCatalogIds(weaponId: GuardWeaponGearId): string[] {
  const rule = RULE_BY_ID.get(weaponId);
  if (!rule) return ['bsis-guard-card'];
  return ['bsis-guard-card', ...rule.requiredCatalogIds];
}

/** Gear labels that require a verified catalog credential. */
export function getWeaponGearUnlockLabels(catalogId: string): string[] {
  return GUARD_WEAPON_GEAR_RULES
    .filter((rule) => rule.requiredCatalogIds.includes(catalogId))
    .map((rule) => rule.shortLabel);
}

export function groupWeaponGearRulesByCategory(): Record<
  GuardWeaponGearCategory,
  GuardWeaponGearRule[]
> {
  const grouped: Record<GuardWeaponGearCategory, GuardWeaponGearRule[]> = {
    'client-approved': [],
    'light-armed': [],
    armed: [],
  };
  for (const rule of GUARD_WEAPON_GEAR_RULES) {
    grouped[rule.category].push(rule);
  }
  return grouped;
}

/** Credential catalog slots shown in each weapon's credentials section (weapon-specific only). */
export function catalogIdsForWeaponGearSection(weaponId: GuardWeaponGearId): string[] {
  switch (weaponId) {
    case 'oc-spray':
      return ['bsis-chemical-agent', 'bsis-chemical-agent-training'];
    case 'baton':
      return ['bsis-baton', 'bsis-baton-training'];
    case 'taser':
      return ['bsis-taser', 'bsis-taser-training'];
    case 'firearm':
      return ['bsis-exposed-firearm', 'bsis-firearms-training', 'bsis-firearms-qualification'];
    default:
      return RULE_BY_ID.get(weaponId)?.requiredCatalogIds ?? [];
  }
}

/** Duty gear listed on profile — no separate credential uploads in the credentials tab. */
export const GUARD_DUTY_GEAR_SECTION_ORDER: GuardWeaponGearId[] = ['flashlight', 'handcuffs'];

/** Weapons that need their own credentials section (permits + training). */
export const WEAPON_GEAR_CREDENTIAL_SECTION_ORDER: GuardWeaponGearId[] = [
  'oc-spray',
  'baton',
  'taser',
  'firearm',
];

export function weaponGearSectionSubtitle(weaponId: GuardWeaponGearId): string {
  const rule = RULE_BY_ID.get(weaponId);
  if (!rule) return '';
  const tier = GUARD_WEAPON_GEAR_CATEGORY_LABELS[rule.category];
  return `${tier} — upload and verify the BSIS permits and training below, then list on your profile.`;
}

export function dutyGearSectionSubtitle(): string {
  return 'Standard duty gear — verified guard card required. No separate credential upload.';
}
