import type {
  GuardEquipmentGearId,
  GuardInventoryEquipmentItem,
  GuardInventoryUniform,
  GuardWeaponGearId,
  SecurityGuard,
} from '../types';
import { getInventoryEquipmentTypeMeta, getInventoryUniformTypeMeta } from './guardInventoryCatalog';
import { normalizeListedEquipmentGear } from './guardEquipmentGear';
import { guardMeetsWeaponGearRequirements, normalizeListedWeaponGear } from './guardWeaponGear';
import { guardHasGuardrVerifiedCredential } from './guardQualification';

export function createInventoryItemId(prefix: string): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `${prefix}-${crypto.randomUUID()}`
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function normalizeInventoryEquipment(
  items: GuardInventoryEquipmentItem[] | undefined
): GuardInventoryEquipmentItem[] {
  if (!items?.length) return [];
  const seen = new Set<string>();
  const normalized: GuardInventoryEquipmentItem[] = [];
  for (const item of items) {
    if (!item?.id || seen.has(item.id) || !getInventoryEquipmentTypeMeta(item.typeId)) continue;
    seen.add(item.id);
    normalized.push({
      ...item,
      quantity: Math.max(1, Math.min(99, Number(item.quantity) || 1)),
      additionalImageUrls: (item.additionalImageUrls ?? []).filter(Boolean),
    });
  }
  return normalized;
}

export function normalizeInventoryUniforms(
  uniforms: GuardInventoryUniform[] | undefined
): GuardInventoryUniform[] {
  if (!uniforms?.length) return [];
  const seen = new Set<string>();
  const normalized: GuardInventoryUniform[] = [];
  for (const uniform of uniforms) {
    if (!uniform?.id || seen.has(uniform.id) || !getInventoryUniformTypeMeta(uniform.typeId)) continue;
    seen.add(uniform.id);
    normalized.push({
      ...uniform,
      description: uniform.description?.trim() ?? '',
      label: uniform.label?.trim() || undefined,
    });
  }
  return normalized;
}

/** Whether a guard may list this equipment type in inventory. */
export function guardCanListInventoryEquipmentType(
  guard: SecurityGuard,
  typeId: GuardInventoryEquipmentItem['typeId']
): boolean {
  const meta = getInventoryEquipmentTypeMeta(typeId);
  if (!meta) return false;
  if (meta.weaponGearId) {
    return guardMeetsWeaponGearRequirements(guard, meta.weaponGearId);
  }
  if (meta.requiresGuardCard) {
    return guardHasGuardrVerifiedCredential(guard, 'bsis-guard-card');
  }
  return true;
}

/** Client-visible equipment — credential-gated types are omitted when requirements are not met. */
export function getClientVisibleInventoryEquipment(
  guard: SecurityGuard
): GuardInventoryEquipmentItem[] {
  return normalizeInventoryEquipment(guard.inventoryEquipment).filter((item) =>
    guardCanListInventoryEquipmentType(guard, item.typeId)
  );
}

export function getClientVisibleInventoryUniforms(guard: SecurityGuard): GuardInventoryUniform[] {
  return normalizeInventoryUniforms(guard.inventoryUniforms);
}

export function inventoryUniformDisplayLabel(uniform: GuardInventoryUniform): string {
  if (uniform.label?.trim()) return uniform.label.trim();
  return getInventoryUniformTypeMeta(uniform.typeId)?.label ?? uniform.typeId;
}

export function inventoryEquipmentDisplayLabel(item: GuardInventoryEquipmentItem): string {
  const meta = getInventoryEquipmentTypeMeta(item.typeId);
  const brandModel = [item.brand, item.model].filter(Boolean).join(' ').trim();
  if (brandModel) return `${meta?.label ?? item.typeId} — ${brandModel}`;
  return meta?.label ?? item.typeId;
}

/** Keep legacy listed gear arrays in sync for armed status and existing filters. */
export function syncLegacyGearFromInventory(
  guard: SecurityGuard,
  equipment: GuardInventoryEquipmentItem[]
): {
  listedWeaponGear: GuardWeaponGearId[];
  listedEquipmentGear: GuardEquipmentGearId[];
} {
  const weaponIds = new Set<GuardWeaponGearId>();
  const equipmentIds = new Set<GuardEquipmentGearId>();

  for (const item of normalizeInventoryEquipment(equipment)) {
    if (!guardCanListInventoryEquipmentType(guard, item.typeId)) continue;
    const meta = getInventoryEquipmentTypeMeta(item.typeId);
    if (meta?.weaponGearId) weaponIds.add(meta.weaponGearId);
    if (meta?.equipmentGearId) equipmentIds.add(meta.equipmentGearId);
  }

  return {
    listedWeaponGear: normalizeListedWeaponGear([...weaponIds]),
    listedEquipmentGear: normalizeListedEquipmentGear([...equipmentIds]),
  };
}

export function parseInventoryEquipmentJson(value: unknown): GuardInventoryEquipmentItem[] {
  if (!Array.isArray(value)) return [];
  return normalizeInventoryEquipment(value as GuardInventoryEquipmentItem[]);
}

export function parseInventoryUniformsJson(value: unknown): GuardInventoryUniform[] {
  if (!Array.isArray(value)) return [];
  return normalizeInventoryUniforms(value as GuardInventoryUniform[]);
}
