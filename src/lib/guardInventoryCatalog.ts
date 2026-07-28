import type {
  GuardEquipmentGearId,
  GuardInventoryEquipmentCondition,
  GuardInventoryEquipmentTypeId,
  GuardInventoryUniformTypeId,
  GuardWeaponGearId,
} from '../types';

export interface GuardInventoryEquipmentTypeMeta {
  id: GuardInventoryEquipmentTypeId;
  label: string;
  shortLabel: string;
  description: string;
  /** Requires a verified BSIS guard card. */
  requiresGuardCard?: boolean;
  /** Weapon gear credential gate — item hidden until requirements met. */
  weaponGearId?: GuardWeaponGearId;
  /** Legacy equipment badge sync. */
  equipmentGearId?: GuardEquipmentGearId;
}

export const GUARD_INVENTORY_EQUIPMENT_TYPES: GuardInventoryEquipmentTypeMeta[] = [
  {
    id: 'body-camera',
    label: 'Body Camera',
    shortLabel: 'Body cam',
    description: 'Body-worn camera for incident documentation and client transparency.',
    equipmentGearId: 'body-cam',
  },
  {
    id: 'flashlight',
    label: 'Flashlight',
    shortLabel: 'Flashlight',
    description: 'Duty flashlight for patrols and low-light posts.',
    requiresGuardCard: true,
    weaponGearId: 'flashlight',
  },
  {
    id: 'handcuffs',
    label: 'Handcuffs',
    shortLabel: 'Handcuffs',
    description: 'Restraint equipment for detentions when authorized.',
    requiresGuardCard: true,
    weaponGearId: 'handcuffs',
  },
  {
    id: 'duty-belt',
    label: 'Duty Belt',
    shortLabel: 'Duty belt',
    description: 'Belt system for duty gear and holsters.',
    requiresGuardCard: true,
  },
  {
    id: 'radio',
    label: 'Radio',
    shortLabel: 'Radio',
    description: 'Two-way radio for on-site coordination.',
    equipmentGearId: 'walkie-talkie',
  },
  {
    id: 'radio-earpiece',
    label: 'Radio Earpiece',
    shortLabel: 'Earpiece',
    description: 'Discrete earpiece for radio communications.',
  },
  {
    id: 'medical-ifak',
    label: 'Medical / IFAK Kit',
    shortLabel: 'IFAK',
    description: 'Individual first aid kit for field medical response.',
    requiresGuardCard: true,
  },
  {
    id: 'tourniquet',
    label: 'Tourniquet',
    shortLabel: 'Tourniquet',
    description: 'Hemorrhage control equipment.',
    requiresGuardCard: true,
  },
  {
    id: 'protective-vest',
    label: 'Protective Vest',
    shortLabel: 'Vest',
    description: 'Ballistic or stab-resistant protective vest.',
    requiresGuardCard: true,
  },
  {
    id: 'traffic-vest',
    label: 'Traffic Vest',
    shortLabel: 'Traffic vest',
    description: 'High-visibility vest for traffic and parking control.',
    requiresGuardCard: true,
  },
  {
    id: 'gloves',
    label: 'Gloves',
    shortLabel: 'Gloves',
    description: 'Duty gloves for searches, restraints, and weather.',
    requiresGuardCard: true,
  },
  {
    id: 'oc-spray',
    label: 'OC Pepper Spray',
    shortLabel: 'OC spray',
    description: 'Chemical agent — requires verified BSIS permits and training.',
    weaponGearId: 'oc-spray',
  },
  {
    id: 'baton',
    label: 'Baton',
    shortLabel: 'Baton',
    description: 'Expandable or straight baton — requires verified BSIS permits and training.',
    weaponGearId: 'baton',
  },
  {
    id: 'ecd',
    label: 'Electronic Control Device (ECD)',
    shortLabel: 'ECD / TASER',
    description: 'Electronic control device — requires verified BSIS training.',
    weaponGearId: 'taser',
  },
  {
    id: 'firearm',
    label: 'Firearm',
    shortLabel: 'Firearm',
    description: 'Handgun — requires verified exposed firearm permit and firearms training.',
    weaponGearId: 'firearm',
  },
  {
    id: 'other-certified',
    label: 'Other Certified Equipment',
    shortLabel: 'Other',
    description: 'Other duty equipment backed by a verified platform credential.',
    requiresGuardCard: true,
  },
];

export interface GuardInventoryUniformTypeMeta {
  id: GuardInventoryUniformTypeId;
  label: string;
  description: string;
  example?: string;
}

export const GUARD_INVENTORY_UNIFORM_TYPES: GuardInventoryUniformTypeMeta[] = [
  {
    id: 'corporate-security',
    label: 'Corporate Security',
    description: 'Professional business attire for corporate lobbies and offices.',
    example: 'White button-up, black dress coat, tie, black pants, and dress shoes.',
  },
  {
    id: 'tactical',
    label: 'Tactical Uniform',
    description: 'Tactical duty uniform for high-visibility security operations.',
    example: 'Black generic security shirt with white patches, black tactical 5.11 pants, tactical boots.',
  },
  {
    id: 'polo',
    label: 'Polo Uniform',
    description: 'Branded or neutral polo for casual professional sites.',
    example: 'Black polo, khaki or black pants, duty belt, and polished boots.',
  },
  {
    id: 'executive-protection',
    label: 'Executive Protection',
    description: 'Low-profile attire for close protection and VIP details.',
    example: 'Tailored suit or sport coat with concealed-carry appropriate fit.',
  },
  {
    id: 'high-visibility',
    label: 'High Visibility',
    description: 'ANSI-style high-visibility uniform for traffic and outdoor posts.',
    example: 'Hi-vis vest or shirt, durable pants, and safety boots.',
  },
  {
    id: 'event-staff',
    label: 'Event Staff',
    description: 'Uniform for concerts, venues, and special events.',
    example: 'All-black event staff attire with radio earpiece and comfortable shoes.',
  },
  {
    id: 'business-casual',
    label: 'Business Casual',
    description: 'Relaxed professional look for mixed office and patrol environments.',
    example: 'Dress shirt or sweater, slacks, and clean dress shoes.',
  },
  {
    id: 'custom',
    label: 'Custom Uniform',
    description: 'Describe a custom look you can provide for client assignments.',
  },
];

export const GUARD_INVENTORY_CONDITION_LABELS: Record<GuardInventoryEquipmentCondition, string> = {
  new: 'New',
  'like-new': 'Like new',
  good: 'Good',
  fair: 'Fair',
  worn: 'Worn',
};

const EQUIPMENT_BY_ID = new Map(GUARD_INVENTORY_EQUIPMENT_TYPES.map((entry) => [entry.id, entry]));
const UNIFORM_BY_ID = new Map(GUARD_INVENTORY_UNIFORM_TYPES.map((entry) => [entry.id, entry]));

export function getInventoryEquipmentTypeMeta(
  typeId: GuardInventoryEquipmentTypeId
): GuardInventoryEquipmentTypeMeta | undefined {
  return EQUIPMENT_BY_ID.get(typeId);
}

export function getInventoryUniformTypeMeta(
  typeId: GuardInventoryUniformTypeId
): GuardInventoryUniformTypeMeta | undefined {
  return UNIFORM_BY_ID.get(typeId);
}

export function isGuardInventoryEquipmentTypeId(value: string): value is GuardInventoryEquipmentTypeId {
  return EQUIPMENT_BY_ID.has(value as GuardInventoryEquipmentTypeId);
}

export function isGuardInventoryUniformTypeId(value: string): value is GuardInventoryUniformTypeId {
  return UNIFORM_BY_ID.has(value as GuardInventoryUniformTypeId);
}
