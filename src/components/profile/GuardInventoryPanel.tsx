import React from 'react';
import type { GuardEquipmentGearId, GuardWeaponGearId, SecurityGuard } from '../../types';
import { computeGuardArmedStatus } from '../../lib/guardArmedStatus';
import { WEAPON_GEAR_CREDENTIAL_SECTION_ORDER } from '../../lib/guardWeaponGear';
import {
  GuardGearCredentialSection,
  GuardWeaponGearCredentialSection,
} from '../credentials/GuardWeaponGearCredentialSection';
import { GuardArmedStatusPill } from '../guard/GuardArmedStatusPill';
import { Package } from 'lucide-react';

interface GuardInventoryPanelProps {
  guard: SecurityGuard;
  editing?: boolean;
  weaponGearSelected?: GuardWeaponGearId[];
  equipmentGearSelected?: GuardEquipmentGearId[];
  onWeaponGearChange?: (next: GuardWeaponGearId[]) => void;
  onEquipmentGearChange?: (next: GuardEquipmentGearId[]) => void;
  showFullCatalog?: boolean;
}

/** Guard gear inventory — separate from credentials. Add buttons unlock when required certs are verified. */
export function GuardInventoryPanel({
  guard,
  editing = false,
  weaponGearSelected,
  equipmentGearSelected,
  onWeaponGearChange,
  onEquipmentGearChange,
  showFullCatalog = true,
}: GuardInventoryPanelProps) {
  const armedStatus = computeGuardArmedStatus(guard);

  return (
    <section className="guard-inventory-panel space-y-2">
      <div className="app-form-section space-y-2 pb-4 border-b border-brand-border">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-text flex items-center gap-2">
          <Package className="w-4 h-4 text-brand-primary shrink-0" />
          Inventory
        </p>
        <p className="text-xs text-brand-text-muted leading-relaxed">
          Inventory is separate from credentials. Upload permits and training on the Credentials tab, then add
          gear here once Guardr verifies each requirement.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <GuardArmedStatusPill guard={guard} status={armedStatus} />
          <span className="text-xs text-brand-text-muted">
            {armedStatus === 'armed'
              ? 'Firearm in inventory'
              : armedStatus === 'light-armed'
                ? 'Less-lethal weapons in inventory'
                : 'No weapons in inventory'}
          </span>
        </div>
      </div>

      {WEAPON_GEAR_CREDENTIAL_SECTION_ORDER.map((weaponId) => (
        <GuardWeaponGearCredentialSection
          key={weaponId}
          variant="inventory"
          weaponId={weaponId}
          guard={guard}
          showFullCatalog={showFullCatalog}
          weaponGearEditing={editing}
          weaponGearSelected={weaponGearSelected}
          onWeaponGearChange={onWeaponGearChange}
        />
      ))}

      <GuardGearCredentialSection
        guard={guard}
        weaponGearEditing={editing}
        equipmentGearEditing={editing}
        weaponGearSelected={weaponGearSelected}
        equipmentGearSelected={equipmentGearSelected}
        onWeaponGearChange={onWeaponGearChange}
        onEquipmentGearChange={onEquipmentGearChange}
        showFullCatalog={showFullCatalog}
      />
    </section>
  );
}
