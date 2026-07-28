import React from 'react';
import type { GuardEquipmentGearId, GuardWeaponGearId, SecurityGuard } from '../../types';
import {
  GUARD_WEAPON_GEAR_CATEGORY_DESCRIPTIONS,
  GUARD_WEAPON_GEAR_CATEGORY_LABELS,
  GUARD_WEAPON_GEAR_CATEGORY_ORDER,
  GUARD_WEAPON_GEAR_RULES,
  catalogIdsForWeaponGearSection,
  getEligibleWeaponGear,
  getMissingWeaponGearCatalogIds,
  getWeaponGearRequiredCatalogIds,
  getWeaponGearCarryStatus,
  guardMeetsWeaponGearRequirements,
  groupWeaponGearRulesByCategory,
} from '../../lib/guardWeaponGear';
import {
  GUARD_EQUIPMENT_GEAR_RULES,
  getClientVisibleListedEquipmentGear,
  normalizeListedEquipmentGear,
} from '../../lib/guardEquipmentGear';
import { computeGuardArmedStatus } from '../../lib/guardArmedStatus';
import { GuardArmedStatusPill } from '../guard/GuardArmedStatusPill';
import { getCertCatalogEntry } from '../../lib/certCatalog';
import { guardHasGuardrVerifiedCredential } from '../../lib/guardQualification';
import { CredentialSectionStatusBadge } from '../credentials/CredentialStatusLabels';
import { Check, Shield, X } from 'lucide-react';

interface GuardGearCarryFieldsProps {
  guard: SecurityGuard;
  weaponGearEditing?: boolean;
  equipmentGearEditing?: boolean;
  weaponGearSelected?: GuardWeaponGearId[];
  equipmentGearSelected?: GuardEquipmentGearId[];
  onWeaponGearChange?: (next: GuardWeaponGearId[]) => void;
  onEquipmentGearChange?: (next: GuardEquipmentGearId[]) => void;
  showFullCatalog?: boolean;
  /** Render inside a credentials section — omits standalone section header. */
  embedded?: boolean;
}

/** Weapon gear rows and equipment badges — embeddable in the credentials panel. */
export function GuardGearCarryFields({
  guard,
  weaponGearEditing = false,
  equipmentGearEditing = false,
  weaponGearSelected,
  equipmentGearSelected,
  onWeaponGearChange,
  onEquipmentGearChange,
  showFullCatalog = true,
  embedded = false,
}: GuardGearCarryFieldsProps) {
  const selectedWeapon = weaponGearSelected ?? guard.listedWeaponGear ?? [];
  const selectedEquipment = equipmentGearSelected ?? guard.listedEquipmentGear ?? [];
  const eligibleWeapon = getEligibleWeaponGear(guard);
  const eligibleWeaponIds = new Set(eligibleWeapon.map((rule) => rule.id));
  const groupedWeaponRules = groupWeaponGearRulesByCategory();
  const armedStatus = computeGuardArmedStatus(guard);

  const toggleWeapon = (id: GuardWeaponGearId) => {
    if (!weaponGearEditing || !onWeaponGearChange) return;
    if (!guardMeetsWeaponGearRequirements(guard, id)) return;
    if (selectedWeapon.includes(id)) {
      onWeaponGearChange(selectedWeapon.filter((item) => item !== id));
      return;
    }
    onWeaponGearChange([...selectedWeapon, id]);
  };

  return (
    <div className={embedded ? 'space-y-4' : 'app-form-section space-y-4'}>
      {!embedded && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-brand-primary flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Gear & carry status
          </p>
          <p className="text-xs text-brand-text-muted leading-relaxed">
            Armed status reflects what you list on your profile after Guardr verifies the required BSIS
            credentials for each item.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <GuardArmedStatusPill guard={guard} status={armedStatus} />
            <span className="text-xs text-brand-text-muted">
              {armedStatus === 'armed'
                ? 'Firearm listed on profile'
                : armedStatus === 'light-armed'
                  ? 'Less-lethal weapons listed on profile'
                  : 'No weapons listed on profile'}
            </span>
          </div>
        </div>
      )}

      {embedded && (
        <div className="space-y-1 pt-2 border-t border-brand-border">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted">
            Weapons & gear carried
          </p>
          <p className="text-xs text-brand-text-muted leading-relaxed">
            List what you carry after Guardr verifies the required BSIS permits and training above.
          </p>
        </div>
      )}

      {GUARD_WEAPON_GEAR_CATEGORY_ORDER.map((category) => {
        const rules = groupedWeaponRules[category];
        const visibleRules = weaponGearEditing || showFullCatalog
          ? rules
          : rules.filter(
              (rule) =>
                selectedWeapon.includes(rule.id) && eligibleWeaponIds.has(rule.id)
            );
        if (visibleRules.length === 0) return null;

        return (
          <div key={category} className="space-y-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted">
                {GUARD_WEAPON_GEAR_CATEGORY_LABELS[category]}
              </p>
              <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">
                {GUARD_WEAPON_GEAR_CATEGORY_DESCRIPTIONS[category]}
              </p>
            </div>
            <ul className="space-y-2">
              {visibleRules.map((rule) => {
                const eligible = eligibleWeaponIds.has(rule.id);
                const listed = selectedWeapon.includes(rule.id);
                const showOnProfile = eligible && listed;

                return (
                  <li key={rule.id}>
                    <WeaponGearRow
                      rule={rule}
                      guard={guard}
                      editing={weaponGearEditing}
                      eligible={eligible}
                      listed={listed}
                      showOnProfile={showOnProfile}
                      onToggle={() => toggleWeapon(rule.id)}
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      <GuardGearCarryEquipmentFields
        guard={guard}
        equipmentGearEditing={equipmentGearEditing}
        equipmentGearSelected={equipmentGearSelected}
        onEquipmentGearChange={onEquipmentGearChange}
        showFullCatalog={showFullCatalog}
      />
    </div>
  );
}

/** Equipment badge toggles — used in the credentials equipment section. */
export function GuardGearCarryEquipmentFields({
  guard,
  equipmentGearEditing = false,
  equipmentGearSelected,
  onEquipmentGearChange,
  showFullCatalog = true,
}: {
  guard: SecurityGuard;
  equipmentGearEditing?: boolean;
  equipmentGearSelected?: GuardEquipmentGearId[];
  onEquipmentGearChange?: (next: GuardEquipmentGearId[]) => void;
  showFullCatalog?: boolean;
}) {
  const equipmentActive = new Set(normalizeListedEquipmentGear(equipmentGearSelected ?? guard.listedEquipmentGear ?? []));

  const toggleEquipment = (id: GuardEquipmentGearId) => {
    if (!equipmentGearEditing || !onEquipmentGearChange) return;
    if (equipmentActive.has(id)) {
      onEquipmentGearChange([...equipmentActive].filter((g) => g !== id) as GuardEquipmentGearId[]);
      return;
    }
    onEquipmentGearChange([...equipmentActive, id] as GuardEquipmentGearId[]);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-2">
        {GUARD_EQUIPMENT_GEAR_RULES.map((rule) => {
          const isOn = equipmentActive.has(rule.id);
          if (!equipmentGearEditing && !showFullCatalog && !isOn) return null;

          if (equipmentGearEditing) {
            return (
              <button
                key={rule.id}
                type="button"
                onClick={() => toggleEquipment(rule.id)}
                className={`wf-list-card text-left transition-all ${
                  isOn ? '!border-brand-primary bg-brand-primary/8' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sm">{rule.label}</p>
                    <p className="text-xs text-brand-text-muted mt-0.5">{rule.description}</p>
                  </div>
                  {isOn ? <Check className="w-5 h-5 text-brand-primary shrink-0" /> : null}
                </div>
              </button>
            );
          }

          if (!isOn) return null;
          return (
            <div key={rule.id} className="wf-list-card">
              <p className="font-semibold text-sm">{rule.label}</p>
              <p className="text-xs text-brand-text-muted mt-0.5">{rule.description}</p>
            </div>
          );
        })}
      </div>
      {!equipmentGearEditing &&
        showFullCatalog &&
        getClientVisibleListedEquipmentGear(guard).length === 0 && (
          <p className="text-xs text-brand-text-muted">No equipment badges listed yet.</p>
        )}
    </div>
  );
}

interface GuardGearCarryPanelProps extends GuardGearCarryFieldsProps {}

/** Standalone gear panel — used in resume editor when not on the credentials tab. */
export function GuardGearCarryPanel(props: GuardGearCarryPanelProps) {
  return <GuardGearCarryFields {...props} />;
}

function WeaponGearRow({
  rule,
  guard,
  editing,
  eligible,
  listed,
  showOnProfile,
  onToggle,
  hideCredentialChecklist = false,
  headerShowsStatus = false,
}: {
  rule: typeof GUARD_WEAPON_GEAR_RULES[number];
  guard: SecurityGuard;
  editing: boolean;
  eligible: boolean;
  listed: boolean;
  showOnProfile: boolean;
  onToggle: () => void;
  /** When credential slots are shown above, omit guard card / duplicate checklist. */
  hideCredentialChecklist?: boolean;
  /** Section header already shows title and status — only render edit checkbox when editing. */
  headerShowsStatus?: boolean;
}) {
  const displayCatalogIds = catalogIdsForWeaponGearSection(rule.id);
  const missingIds = getMissingWeaponGearCatalogIds(guard, rule.id).filter(
    (id) => id !== 'bsis-guard-card'
  );

  const { label: statusLabel, tone: statusTone } = getWeaponGearCarryStatus({
    eligible,
    listed,
    showOnProfile,
  });

  if (headerShowsStatus && !editing) return null;

  if (editing) {
    if (headerShowsStatus) {
      return (
        <label
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
            eligible
              ? 'border-brand-border bg-brand-surface cursor-pointer hover:border-brand-primary/40'
              : 'border-brand-border/60 bg-brand-bg-sec opacity-80 cursor-not-allowed'
          }`}
        >
          <input
            type="checkbox"
            className="mt-1"
            checked={listed}
            disabled={!eligible}
            onChange={onToggle}
            aria-label={`List ${rule.label} on profile`}
          />
          <span className="text-sm text-brand-text-muted leading-relaxed">
            List {rule.shortLabel} on your profile after credentials are verified
          </span>
        </label>
      );
    }
    return (
      <label
        className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
          eligible
            ? 'border-brand-border bg-brand-surface cursor-pointer hover:border-brand-primary/40'
            : 'border-brand-border/60 bg-brand-bg-sec opacity-80 cursor-not-allowed'
        }`}
      >
        <input
          type="checkbox"
          className="mt-1"
          checked={listed}
          disabled={!eligible}
          onChange={onToggle}
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-brand-text">{rule.label}</span>
            <CredentialSectionStatusBadge label={statusLabel} tone={statusTone} />
          </span>
          {!hideCredentialChecklist && displayCatalogIds.length > 0 && (
            <GearCredentialRequirements guard={guard} catalogIds={displayCatalogIds} />
          )}
        </span>
      </label>
    );
  }

  return (
    <div className="app-list-subrow space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-brand-text">{rule.label}</p>
        <CredentialSectionStatusBadge label={statusLabel} tone={statusTone} />
      </div>
      {!hideCredentialChecklist && (
        <>
          <GearCredentialRequirements guard={guard} catalogIds={displayCatalogIds} compact={showOnProfile} />
          {!eligible && missingIds.length > 0 && (
            <p className="text-xs text-brand-text-muted">
              Still needed:{' '}
              {missingIds
                .map((id) => getCertCatalogEntry(id)?.shortLabel ?? getCertCatalogEntry(id)?.name ?? id)
                .join(' · ')}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export const GuardWeaponGearCarryRow = WeaponGearRow;

function GearCredentialRequirements({
  guard,
  catalogIds,
  compact = false,
}: {
  guard: SecurityGuard;
  catalogIds: string[];
  compact?: boolean;
}) {
  if (catalogIds.length === 0) return null;

  return (
    <ul className={`space-y-1 ${compact ? 'mt-1' : 'mt-2'}`}>
      {catalogIds.map((catalogId) => {
        const entry = getCertCatalogEntry(catalogId);
        const verified = guardHasGuardrVerifiedCredential(guard, catalogId);
        const label = entry?.shortLabel ?? entry?.name ?? catalogId;
        return (
          <li key={catalogId} className="flex items-center gap-2 text-xs text-brand-text-muted">
            {verified ? (
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden />
            ) : (
              <X className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden />
            )}
            <span className={verified ? 'text-brand-text' : ''}>{label}</span>
          </li>
        );
      })}
    </ul>
  );
}

interface GuardGearCarryClientSectionProps {
  guard: SecurityGuard;
}

/** Client-facing gear summary — embeddable in the credentials weapons section. */
export function GuardGearCarryClientFields({ guard }: { guard: SecurityGuard }) {
  const grouped = groupWeaponGearRulesByCategory();
  const eligibleIds = new Set(getEligibleWeaponGear(guard).map((rule) => rule.id));
  const listedIds = new Set(guard.listedWeaponGear ?? []);
  const equipment = getClientVisibleListedEquipmentGear(guard);

  const listedByCategory = GUARD_WEAPON_GEAR_CATEGORY_ORDER.map((category) => ({
    category,
    items: grouped[category].filter(
      (rule) => listedIds.has(rule.id) && eligibleIds.has(rule.id)
    ),
  })).filter((section) => section.items.length > 0);

  if (listedByCategory.length === 0 && equipment.length === 0) return null;

  return (
    <div className="space-y-3 pt-3 border-t border-brand-border">
      {listedByCategory.map(({ category, items }) => (
        <div key={category} className="space-y-2">
          <p className="text-xs font-semibold text-brand-text-muted">
            {GUARD_WEAPON_GEAR_CATEGORY_LABELS[category]}
          </p>
          <div className="flex flex-wrap gap-2">
            {items.map((rule) => (
              <span
                key={rule.id}
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              >
                {rule.label}
              </span>
            ))}
          </div>
        </div>
      ))}

      {equipment.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-brand-text-muted">Equipment</p>
          <div className="flex flex-wrap gap-2">
            {equipment.map((rule) => (
              <span
                key={rule.id}
                className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border bg-brand-primary/10 text-brand-primary border-brand-primary/25"
              >
                {rule.label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Standalone client gear section — prefer GuardGearCarryClientFields inside credentials. */
export function GuardGearCarryClientSection({ guard }: GuardGearCarryClientSectionProps) {
  const grouped = groupWeaponGearRulesByCategory();
  const eligibleIds = new Set(getEligibleWeaponGear(guard).map((rule) => rule.id));
  const listedIds = new Set(guard.listedWeaponGear ?? []);
  const equipment = getClientVisibleListedEquipmentGear(guard);
  const hasListedGear =
    GUARD_WEAPON_GEAR_CATEGORY_ORDER.some((category) =>
      grouped[category].some((rule) => listedIds.has(rule.id) && eligibleIds.has(rule.id))
    ) || equipment.length > 0;

  if (!hasListedGear) return null;

  const armedStatus = computeGuardArmedStatus(guard);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted">
          Gear carried
        </p>
        <GuardArmedStatusPill guard={guard} status={armedStatus} />
      </div>
      <GuardGearCarryClientFields guard={guard} />
    </section>
  );
}
