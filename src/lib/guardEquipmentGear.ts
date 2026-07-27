import type { GuardEquipmentGearId, SecurityGuard } from '../types';

export interface GuardEquipmentGearRule {
  id: GuardEquipmentGearId;
  label: string;
  shortLabel: string;
  description: string;
}

export const GUARD_EQUIPMENT_GEAR_RULES: GuardEquipmentGearRule[] = [
  {
    id: 'body-cam',
    label: 'Body-worn camera',
    shortLabel: 'Body cam',
    description: 'Records incidents and check-ins for client transparency.',
  },
  {
    id: 'walkie-talkie',
    label: 'Two-way radio / walkie',
    shortLabel: 'Walkie',
    description: 'On-site team coordination and dispatch contact.',
  },
];

const RULE_BY_ID = new Map(GUARD_EQUIPMENT_GEAR_RULES.map((rule) => [rule.id, rule]));

export function isGuardEquipmentGearId(value: string): value is GuardEquipmentGearId {
  return RULE_BY_ID.has(value as GuardEquipmentGearId);
}

export function normalizeListedEquipmentGear(values: string[] | undefined): GuardEquipmentGearId[] {
  if (!values?.length) return [];
  const seen = new Set<GuardEquipmentGearId>();
  const normalized: GuardEquipmentGearId[] = [];
  for (const value of values) {
    if (!isGuardEquipmentGearId(value) || seen.has(value)) continue;
    seen.add(value);
    normalized.push(value);
  }
  return normalized;
}

export function getClientVisibleListedEquipmentGear(guard: SecurityGuard): GuardEquipmentGearRule[] {
  const listed = normalizeListedEquipmentGear(guard.listedEquipmentGear);
  return listed.map((id) => RULE_BY_ID.get(id)!).filter(Boolean);
}
