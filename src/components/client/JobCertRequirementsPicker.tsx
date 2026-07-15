import React from 'react';
import { JOB_CERT_FILTER_OPTIONS } from '../../lib/certCatalog';
import {
  GUARD_PATHWAY_STATUS_DESCRIPTIONS,
  GUARD_PATHWAY_STATUS_LABELS,
  GUARD_STATUS_LABELS,
} from '../../lib/guardQualification';
import { MinGuardQualification } from '../../types';
import { Check } from 'lucide-react';

interface JobCertRequirementsPickerProps {
  selected: string[];
  onChange: (ids: string[]) => void;
  jobState?: string;
  minGuardQualification: MinGuardQualification;
  onMinQualificationChange: (level: MinGuardQualification) => void;
  minYearsExperience?: number;
  onMinYearsExperienceChange?: (years: number) => void;
}

export function JobCertRequirementsPicker({
  selected,
  onChange,
  jobState,
  minGuardQualification,
  onMinQualificationChange,
  minYearsExperience = 0,
  onMinYearsExperienceChange,
}: JobCertRequirementsPickerProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Guard requirements</h2>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">Minimum guard status</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {(['pending', 'active'] as MinGuardQualification[]).map((level) => {
            const active = minGuardQualification === level;
            return (
              <button
                key={level}
                type="button"
                onClick={() => onMinQualificationChange(level)}
                className={`text-left p-4 rounded-xl border transition-all ${
                  active ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-border hover:border-brand-primary/40'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{GUARD_PATHWAY_STATUS_LABELS[level]}</p>
                    <p className="text-xs text-brand-text-muted mt-1">{GUARD_PATHWAY_STATUS_DESCRIPTIONS[level]}</p>
                  </div>
                  {active && <Check className="w-5 h-5 text-brand-primary shrink-0" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {onMinYearsExperienceChange && (
        <div>
          <p className="text-sm font-semibold mb-1.5">Minimum years of experience</p>
          <input
            type="number"
            min={0}
            max={40}
            value={minYearsExperience || ''}
            onChange={(e) => onMinYearsExperienceChange(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="uber-input rounded-xl w-full"
            placeholder="0 = no minimum"
          />
        </div>
      )}

      <div>
        <p className="text-sm font-semibold mb-2">Additional requirements (if applicable)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {JOB_CERT_FILTER_OPTIONS.filter((o) => o.id !== 'bsis-guard-card').map((opt) => {
          const active = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              className={`text-left p-4 rounded-xl border transition-all ${
                active ? 'border-brand-primary bg-brand-primary/10' : 'border-brand-border hover:border-brand-primary/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm">{opt.label}</p>
                  <p className="text-xs text-brand-text-muted mt-0.5">{opt.description}</p>
                </div>
                {active && <Check className="w-5 h-5 text-brand-primary shrink-0" />}
              </div>
            </button>
          );
        })}
        </div>
      </div>
    </div>
  );
}
