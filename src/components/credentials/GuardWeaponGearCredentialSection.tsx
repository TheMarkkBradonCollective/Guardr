import React from 'react';
import type { Certification, GuardEquipmentGearId, GuardWeaponGearId, SecurityGuard } from '../../types';
import type { CertCategory } from '../../lib/certCatalog';
import { getCertCatalogEntry } from '../../lib/certCatalog';
import { buildCredentialCatalogSlots } from '../../lib/guardCredentialCatalog';
import {
  GUARD_WEAPON_GEAR_RULES,
  catalogIdsForWeaponGearSection,
  getEligibleWeaponGear,
  guardMeetsWeaponGearRequirements,
  weaponGearSectionSubtitle,
} from '../../lib/guardWeaponGear';
import { CredentialCatalogSlotList } from './CredentialCatalogSlotList';
import { CredentialRowHeader } from './CredentialStatusLabels';
import { GuardGearCarryEquipmentFields, GuardWeaponGearCarryRow } from '../profile/GuardGearCarryPanel';
import { GuardArmedStatusPill } from '../guard/GuardArmedStatusPill';
import { Shield } from 'lucide-react';

type CredentialAddSection = CertCategory | 'bsis-other-training';

interface GuardWeaponGearCredentialSectionProps {
  weaponId: GuardWeaponGearId;
  guard: SecurityGuard;
  search?: string;
  staffMode?: boolean;
  canUpload?: boolean;
  editing?: boolean;
  verifiedOnly?: boolean;
  showFullCatalog?: boolean;
  weaponGearEditing?: boolean;
  weaponGearSelected?: GuardWeaponGearId[];
  onWeaponGearChange?: (next: GuardWeaponGearId[]) => void;
  onAdd?: (catalogId: string, openSection: CredentialAddSection) => void;
  onEditCert?: (cert: Certification) => void;
  renderCertRow?: (cert: Certification) => React.ReactNode;
  certCardProps?: (cert: Certification) => Record<string, unknown>;
}

export function GuardWeaponGearCredentialSection({
  weaponId,
  guard,
  search = '',
  staffMode = false,
  canUpload = false,
  editing = false,
  verifiedOnly = false,
  showFullCatalog = true,
  weaponGearEditing = false,
  weaponGearSelected,
  onWeaponGearChange,
  onAdd,
  onEditCert,
  renderCertRow,
  certCardProps,
}: GuardWeaponGearCredentialSectionProps) {
  const rule = GUARD_WEAPON_GEAR_RULES.find((entry) => entry.id === weaponId);
  if (!rule) return null;

  const catalogIds = catalogIdsForWeaponGearSection(weaponId);
  const slots = buildCredentialCatalogSlots(guard, catalogIds, {
    search,
    verifiedOnly,
    excludeRejected: true,
  });
  const searchActive = Boolean(search.trim());
  const normalizedSearch = search.trim().toLowerCase();
  const nameMatches =
    !searchActive ||
    rule.label.toLowerCase().includes(normalizedSearch) ||
    rule.shortLabel.toLowerCase().includes(normalizedSearch);

  if (searchActive && !nameMatches && slots.length === 0) return null;
  if (!showFullCatalog && slots.length === 0 && !weaponGearEditing) return null;

  const selectedWeapon = weaponGearSelected ?? guard.listedWeaponGear ?? [];
  const eligible = getEligibleWeaponGear(guard).some((entry) => entry.id === weaponId);
  const listed = selectedWeapon.includes(weaponId);
  const showOnProfile = eligible && listed;

  const toggleWeapon = () => {
    if (!weaponGearEditing || !onWeaponGearChange) return;
    if (!guardMeetsWeaponGearRequirements(guard, weaponId)) return;
    if (listed) {
      onWeaponGearChange(selectedWeapon.filter((item) => item !== weaponId));
      return;
    }
    onWeaponGearChange([...selectedWeapon, weaponId]);
  };

  const handleAdd = (catalogId: string) => {
    const entry = getCertCatalogEntry(catalogId);
    const openSection: CredentialAddSection =
      entry?.category === 'bsis-training' ? 'bsis-other-training' : (entry?.category ?? 'bsis-permit');
    onAdd?.(catalogId, openSection);
  };

  return (
    <section className="app-form-section space-y-3 pb-4 border-b border-brand-border">
      <CredentialRowHeader
        rawTitle
        title={
          <p className="uber-label flex items-center gap-2 flex-wrap">
            <Shield className="w-4 h-4 text-brand-primary shrink-0" />
            {rule.label}
            {weaponId === 'firearm' && <GuardArmedStatusPill guard={guard} className="!text-xs" />}
          </p>
        }
        subtitle={
          <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
            {weaponGearSectionSubtitle(weaponId)}
          </p>
        }
      />

      <div className="border-t border-brand-border pt-3 space-y-3">
        {catalogIds.length > 0 && (
          <CredentialCatalogSlotList
            guard={guard}
            slots={slots}
            staffMode={staffMode}
            canUpload={canUpload}
            editing={editing}
            onAdd={handleAdd}
            onEditCert={onEditCert}
            renderCertRow={renderCertRow}
            certCardProps={certCardProps}
          />
        )}

        <GuardWeaponGearCarryRow
          rule={rule}
          guard={guard}
          editing={weaponGearEditing}
          eligible={eligible}
          listed={listed}
          showOnProfile={showOnProfile}
          onToggle={toggleWeapon}
        />
      </div>
    </section>
  );
}

interface GuardEquipmentGearCredentialSectionProps {
  guard: SecurityGuard;
  equipmentGearEditing?: boolean;
  equipmentGearSelected?: GuardEquipmentGearId[];
  onEquipmentGearChange?: (next: GuardEquipmentGearId[]) => void;
  showFullCatalog?: boolean;
}

export function GuardEquipmentGearCredentialSection({
  guard,
  equipmentGearEditing = false,
  equipmentGearSelected,
  onEquipmentGearChange,
  showFullCatalog = true,
}: GuardEquipmentGearCredentialSectionProps) {
  return (
    <section className="app-form-section space-y-3 pb-4 border-b border-brand-border">
      <CredentialRowHeader
        rawTitle
        title={
          <p className="uber-label flex items-center gap-2 flex-wrap">
            <Shield className="w-4 h-4 text-brand-primary shrink-0" />
            Equipment badges
          </p>
        }
        subtitle={
          <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
            Optional gear clients see on your profile — no credential upload required.
          </p>
        }
      />
      <div className="border-t border-brand-border pt-3">
        <GuardGearCarryEquipmentFields
          guard={guard}
          equipmentGearEditing={equipmentGearEditing}
          equipmentGearSelected={equipmentGearSelected}
          onEquipmentGearChange={onEquipmentGearChange}
          showFullCatalog={showFullCatalog}
        />
      </div>
    </section>
  );
}
