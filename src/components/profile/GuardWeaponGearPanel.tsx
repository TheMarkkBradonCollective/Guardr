import React from 'react';
import { GuardWeaponGearId, SecurityGuard } from '../../types';
import {
  GUARD_WEAPON_GEAR_RULES,
  getClientVisibleListedWeaponGear,
  getEligibleWeaponGear,
  getGuardArmedDisplayLevel,
  guardArmedDisplayLevelIndicator,
  guardArmedDisplayLevelLabel,
  guardMeetsWeaponGearRequirements,
  shouldShowGuardArmedDisplayLevel,
} from '../../lib/guardWeaponGear';
import { Shield } from 'lucide-react';

interface GuardWeaponGearPanelProps {
  guard: SecurityGuard;
  editing: boolean;
  selected: GuardWeaponGearId[];
  onChange: (next: GuardWeaponGearId[]) => void;
}

export function GuardWeaponGearPanel({
  guard,
  editing,
  selected,
  onChange,
}: GuardWeaponGearPanelProps) {
  const eligible = getEligibleWeaponGear(guard);
  const eligibleIds = new Set(eligible.map((rule) => rule.id));
  const visibleListed = GUARD_WEAPON_GEAR_RULES.filter(
    (rule) => selected.includes(rule.id) && eligibleIds.has(rule.id)
  );
  const showArmedLevel = shouldShowGuardArmedDisplayLevel(guard);
  const armedLevel = getGuardArmedDisplayLevel(guard);

  const toggle = (id: GuardWeaponGearId) => {
    if (!guardMeetsWeaponGearRequirements(guard, id)) return;
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id));
      return;
    }
    onChange([...selected, id]);
  };

  return (
    <section className="app-form-section space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-brand-primary flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Weapons & gear I carry
        </p>
        <p className="text-xs text-brand-text-muted leading-relaxed">
          List gear on your profile once Guardr has verified the California BSIS credentials for each item.
          Your armed status is shown to clients after your profile is approved.
        </p>
      </div>

      {showArmedLevel && (
        <p className="text-xs font-medium text-brand-text">
          Profile status: {guardArmedDisplayLevelIndicator(armedLevel)} {guardArmedDisplayLevelLabel(armedLevel)}
        </p>
      )}

      {editing ? (
        <ul className="space-y-2">
          {GUARD_WEAPON_GEAR_RULES.map((rule) => {
            const eligibleForRule = eligibleIds.has(rule.id);
            const checked = selected.includes(rule.id);
            return (
              <li key={rule.id}>
                <label
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${
                    eligibleForRule
                      ? 'border-brand-border bg-brand-surface cursor-pointer hover:border-brand-primary/40'
                      : 'border-brand-border/60 bg-brand-bg-sec opacity-70 cursor-not-allowed'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={checked}
                    disabled={!eligibleForRule}
                    onChange={() => toggle(rule.id)}
                  />
                  <span className="min-w-0">
                    <span className="text-sm font-semibold text-brand-text block">{rule.label}</span>
                    <span className="text-xs text-brand-text-muted mt-0.5 block leading-relaxed">
                      {eligibleForRule
                        ? 'Requirements met — you can show this on your profile'
                        : 'Upload and verify required credentials first'}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      ) : visibleListed.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {visibleListed.map((rule) => (
            <span
              key={rule.id}
              className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
            >
              {rule.shortLabel}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-brand-text-muted">No carried gear listed yet.</p>
      )}
    </section>
  );
}

interface GuardWeaponGearClientSectionProps {
  guard: SecurityGuard;
}

export function GuardWeaponGearClientSection({ guard }: GuardWeaponGearClientSectionProps) {
  const listed = getClientVisibleListedWeaponGear(guard);
  if (listed.length === 0) return null;

  return (
    <section>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted mb-2">
        Weapons & gear carried
      </p>
      <div className="flex flex-wrap gap-2">
        {listed.map((rule) => (
          <span
            key={rule.id}
            className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
          >
            {rule.label}
          </span>
        ))}
      </div>
    </section>
  );
}
