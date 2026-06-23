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
}

export function JobCertRequirementsPicker({
  selected,
  onChange,
  jobState,
  minGuardQualification,
  onMinQualificationChange,
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
        <p className="text-sm text-brand-text-muted mt-1">
          Select certifications guards must have on file. Guard Card is always required for{' '}
          {jobState ? `${jobState} ` : ''}jobs.
        </p>
      </div>

      <div className="rounded-xl border border-brand-primary/25 bg-brand-primary/8 p-3 text-sm">
        <span className="font-semibold text-brand-primary">Always required:</span> Valid BSIS Guard Card uploaded for{' '}
        {jobState ? `${jobState} ` : ''}jobs ({GUARD_STATUS_LABELS.active} with guard card). Guardr verification is shown to
        clients as a trust badge.
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">Minimum guard status</p>
        <p className="text-xs text-brand-text-muted">
          All guards need a valid guard card, government ID, PTA/UOF, and the 32-hour BSIS course block to work field
          jobs. Choose whether you prefer guards with full training verified on file.
        </p>
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
