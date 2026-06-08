import React from 'react';
import { JOB_CERT_FILTER_OPTIONS } from '../../lib/certCatalog';
import { Check } from 'lucide-react';

interface JobCertRequirementsPickerProps {
  selected: string[];
  onChange: (ids: string[]) => void;
  jobState?: string;
}

export function JobCertRequirementsPicker({
  selected,
  onChange,
  jobState,
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
          Select certifications guards must have verified on their profile. Guard Card is always required for{' '}
          {jobState ? `${jobState} ` : ''}jobs.
        </p>
      </div>

      <div className="rounded-xl border border-brand-primary/25 bg-brand-primary/8 p-3 text-sm">
        <span className="font-semibold text-brand-primary">Always required:</span> BSIS Guard Card for job state
      </div>

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
  );
}
