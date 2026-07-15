import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { JobType, SecurityGuard } from '../../types';
import {
  JOB_TYPE_PREFERENCE_OPTIONS,
  normalizeJobTypePreferences,
} from '../../lib/guardJobPreferences';
import { isJobTypeOnboarded } from '../../lib/guardJobTypeOnboarding';
import { AppSwitch } from '../ui/AppSwitch';
import { JobTypeOnboardingSheet } from './JobTypeOnboardingSheet';

interface GuardJobPreferencesPanelProps {
  guard: SecurityGuard;
  onChange: (preferences: JobType[]) => void | Promise<void>;
  onCompleteOnboarding: (jobType: JobType) => void | Promise<void>;
  saving?: boolean;
}

export function GuardJobPreferencesPanel({
  guard,
  onChange,
  onCompleteOnboarding,
  saving = false,
}: GuardJobPreferencesPanelProps) {
  const selected = new Set(normalizeJobTypePreferences(guard.jobTypePreferences));
  const [onboardingType, setOnboardingType] = useState<JobType | null>(null);
  const [onboardingBusy, setOnboardingBusy] = useState(false);

  const setPreference = (type: JobType, enabled: boolean) => {
    const next = enabled
      ? [...new Set([...selected, type])]
      : [...selected].filter((value) => value !== type);
    void onChange(next);
  };

  const handleToggle = (type: JobType) => {
    const onboarded = isJobTypeOnboarded(guard, type);
    if (!onboarded) {
      setOnboardingType(type);
      return;
    }
    setPreference(type, !selected.has(type));
  };

  const handleCompleteOnboarding = async (type: JobType) => {
    setOnboardingBusy(true);
    try {
      await onCompleteOnboarding(type);
      setOnboardingType(null);
      setPreference(type, true);
    } finally {
      setOnboardingBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-brand-text-muted leading-relaxed">
        Choose which job types you want alerts for. Every type starts off until you complete onboarding
        and turn it on.
      </p>
      <div className="grid grid-cols-1 gap-3">
        {JOB_TYPE_PREFERENCE_OPTIONS.map((option) => {
          const active = selected.has(option.type);
          const onboarded = isJobTypeOnboarded(guard, option.type);
          return (
            <div key={option.type} className="wf-list-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-brand-text">{option.label}</p>
                  <p className="text-xs text-brand-text-muted leading-relaxed mt-1">{option.description}</p>
                </div>
                <AppSwitch
                  checked={active}
                  disabled={saving || onboardingBusy}
                  onChange={() => handleToggle(option.type)}
                  ariaLabel={`${option.label} job alerts`}
                />
              </div>
              {!onboarded && (
                <button
                  type="button"
                  disabled={saving || onboardingBusy}
                  onClick={() => setOnboardingType(option.type)}
                  className="w-full flex items-center justify-between gap-2 text-sm font-semibold text-brand-primary hover:text-brand-primary/80 transition-colors"
                >
                  <span>Complete onboarding</span>
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <JobTypeOnboardingSheet
        jobType={onboardingType}
        open={onboardingType != null}
        saving={onboardingBusy}
        onClose={() => setOnboardingType(null)}
        onComplete={handleCompleteOnboarding}
      />
    </div>
  );
}
