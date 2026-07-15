import React from 'react';
import type { JobType, SecurityGuard } from '../../types';
import {
  ALL_JOB_TYPE_PREFERENCES,
  jobTypePreferenceLabel,
  normalizeJobTypePreferences,
} from '../../lib/guardJobPreferences';

interface GuardJobPreferencesPanelProps {
  guard: SecurityGuard;
  onChange: (preferences: JobType[]) => void | Promise<void>;
  saving?: boolean;
}

export function GuardJobPreferencesPanel({
  guard,
  onChange,
  saving = false,
}: GuardJobPreferencesPanelProps) {
  const selected = new Set(normalizeJobTypePreferences(guard.jobTypePreferences));

  const toggle = (type: JobType) => {
    const next = selected.has(type)
      ? [...selected].filter((t) => t !== type)
      : [...selected, type];
    void onChange(next);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-brand-text-muted leading-relaxed">
        Choose which job types you want alerts for — like DoorDash service preferences. Leave all on
        to hear about every open post.
      </p>
      <div className="grid grid-cols-1 gap-2">
        {ALL_JOB_TYPE_PREFERENCES.map((type) => {
          const active = selected.has(type);
          return (
            <button
              key={type}
              type="button"
              disabled={saving}
              onClick={() => toggle(type)}
              className={`wf-list-card text-left transition-all ${
                active ? '!border-brand-primary bg-brand-primary/8' : ''
              }`}
            >
              <span className="font-semibold text-sm">{jobTypePreferenceLabel(type)}</span>
              <span className="text-xs text-brand-text-muted block mt-0.5">
                {active ? 'Notifications on' : 'Notifications off'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
