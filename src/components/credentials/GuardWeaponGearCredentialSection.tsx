import React from 'react';
import type { Certification, GuardEquipmentGearId, GuardWeaponGearId, SecurityGuard } from '../../types';
import type { CertCategory } from '../../lib/certCatalog';
import { getCertCatalogEntry } from '../../lib/certCatalog';
import { buildCredentialCatalogSlots } from '../../lib/guardCredentialCatalog';
import {
  GUARD_DUTY_GEAR_SECTION_ORDER,
  GUARD_WEAPON_GEAR_RULES,
  catalogIdsForWeaponGearSection,
  dutyGearSectionSubtitle,
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
          hideCredentialChecklist
        />
      </div>
    </section>
  );
}

interface GuardGearCredentialSectionProps {
  guard: SecurityGuard;
  weaponGearEditing?: boolean;
  equipmentGearEditing?: boolean;
  weaponGearSelected?: GuardWeaponGearId[];
  equipmentGearSelected?: GuardEquipmentGearId[];
  onWeaponGearChange?: (next: GuardWeaponGearId[]) => void;
  onEquipmentGearChange?: (next: GuardEquipmentGearId[]) => void;
  showFullCatalog?: boolean;
}

/** Flashlight, handcuffs, and equipment badges — no separate credential uploads. */
export function GuardGearCredentialSection({
  guard,
  weaponGearEditing = false,
  equipmentGearEditing = false,
  weaponGearSelected,
  equipmentGearSelected,
  onWeaponGearChange,
  onEquipmentGearChange,
  showFullCatalog = true,
}: GuardGearCredentialSectionProps) {
  const selectedWeapon = weaponGearSelected ?? guard.listedWeaponGear ?? [];
  const eligibleIds = new Set(getEligibleWeaponGear(guard).map((entry) => entry.id));

  const toggleWeapon = (weaponId: GuardWeaponGearId) => {
    if (!weaponGearEditing || !onWeaponGearChange) return;
    if (!guardMeetsWeaponGearRequirements(guard, weaponId)) return;
    if (selectedWeapon.includes(weaponId)) {
      onWeaponGearChange(selectedWeapon.filter((item) => item !== weaponId));
      return;
    }
    onWeaponGearChange([...selectedWeapon, weaponId]);
  };

  return (
    <section className="app-form-section space-y-3 pb-4 border-b border-brand-border">
      <CredentialRowHeader
        rawTitle
        title={
          <p className="uber-label flex items-center gap-2 flex-wrap">
            <Shield className="w-4 h-4 text-brand-primary shrink-0" />
            Guard gear
          </p>
        }
        subtitle={
          <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">{dutyGearSectionSubtitle()}</p>
        }
      />
      <div className="border-t border-brand-border pt-3 space-y-4">
        <div className="space-y-2">
          {GUARD_DUTY_GEAR_SECTION_ORDER.map((weaponId) => {
            const rule = GUARD_WEAPON_GEAR_RULES.find((entry) => entry.id === weaponId);
            if (!rule) return null;
            const eligible = eligibleIds.has(weaponId);
            const listed = selectedWeapon.includes(weaponId);
            if (!weaponGearEditing && !showFullCatalog && !listed) return null;

            return (
              <GuardWeaponGearCarryRow
                key={weaponId}
                rule={rule}
                guard={guard}
                editing={weaponGearEditing}
                eligible={eligible}
                listed={listed}
                showOnProfile={eligible && listed}
                onToggle={() => toggleWeapon(weaponId)}
                hideCredentialChecklist
              />
            );
          })}
        </div>
        <div className="space-y-2 pt-2 border-t border-brand-border">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted">
            Equipment badges
          </p>
          <p className="text-xs text-brand-text-muted leading-relaxed">
            Optional gear clients see on your profile — no credential upload required.
          </p>
        </div>
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

interface GuardEquipmentGearCredentialSectionProps {
  guard: SecurityGuard;
  equipmentGearEditing?: boolean;
  equipmentGearSelected?: GuardEquipmentGearId[];
  onEquipmentGearChange?: (next: GuardEquipmentGearId[]) => void;
  showFullCatalog?: boolean;
}

/** @deprecated Use GuardGearCredentialSection */
export function GuardEquipmentGearCredentialSection({
  guard,
  equipmentGearEditing = false,
  equipmentGearSelected,
  onEquipmentGearChange,
  showFullCatalog = true,
}: GuardEquipmentGearCredentialSectionProps) {
  return (
    <GuardGearCredentialSection
      guard={guard}
      equipmentGearEditing={equipmentGearEditing}
      equipmentGearSelected={equipmentGearSelected}
      onEquipmentGearChange={onEquipmentGearChange}
      showFullCatalog={showFullCatalog}
    />
  );
}
