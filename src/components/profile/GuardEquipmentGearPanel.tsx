import React from 'react';
import type { GuardEquipmentGearId, SecurityGuard } from '../../types';
import {
  GUARD_EQUIPMENT_GEAR_RULES,
  normalizeListedEquipmentGear,
} from '../../lib/guardEquipmentGear';
import { Check } from 'lucide-react';

interface GuardEquipmentGearPanelProps {
  guard: SecurityGuard;
  selected: GuardEquipmentGearId[];
  onChange: (gear: GuardEquipmentGearId[]) => void;
  editing?: boolean;
}

export function GuardEquipmentGearPanel({
  selected,
  onChange,
  editing = true,
}: GuardEquipmentGearPanelProps) {
  const active = new Set(normalizeListedEquipmentGear(selected));

  const toggle = (id: GuardEquipmentGearId) => {
    if (!editing) return;
    const next = active.has(id)
      ? [...active].filter((g) => g !== id)
      : [...active, id];
    onChange(next as GuardEquipmentGearId[]);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-brand-text-muted leading-relaxed">
        Equipment badges shown on your profile when clients browse guards.
      </p>
      <div className="grid grid-cols-1 gap-2">
        {GUARD_EQUIPMENT_GEAR_RULES.map((rule) => {
          const isOn = active.has(rule.id);
          return (
            <button
              key={rule.id}
              type="button"
              disabled={!editing}
              onClick={() => toggle(rule.id)}
              className={`wf-list-card text-left transition-all ${
                isOn ? '!border-brand-primary bg-brand-primary/8' : ''
              } ${!editing ? 'opacity-90' : ''}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-sm">{rule.label}</p>
                  <p className="text-xs text-brand-text-muted mt-0.5">{rule.description}</p>
                </div>
                {isOn && <Check className="w-5 h-5 text-brand-primary shrink-0" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
