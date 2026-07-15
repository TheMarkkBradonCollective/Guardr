import React, { useState } from 'react';
import type { JobType } from '../../types';
import { jobTypeOnboardingContent } from '../../lib/guardJobTypeOnboarding';
import { jobTypePreferenceLabel } from '../../lib/guardJobPreferences';
import { AppFormSheet } from '../ui/app/AppFormSheet';

interface JobTypeOnboardingSheetProps {
  jobType: JobType | null;
  open: boolean;
  saving?: boolean;
  onClose: () => void;
  onComplete: (jobType: JobType) => void | Promise<void>;
}

export function JobTypeOnboardingSheet({
  jobType,
  open,
  saving = false,
  onClose,
  onComplete,
}: JobTypeOnboardingSheetProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  const content = jobType ? jobTypeOnboardingContent(jobType) : null;

  const handleClose = () => {
    setAcknowledged(false);
    onClose();
  };

  return (
    <AppFormSheet
      open={open}
      onClose={handleClose}
      title={content?.title ?? jobTypePreferenceLabel(jobType ?? 'other')}
      subtitle="Complete onboarding before accepting this job type."
    >
      {content && jobType && (
        <div className="space-y-5">
          <p className="text-sm text-brand-text-muted leading-relaxed">{content.summary}</p>
          <div className="rounded-xl border border-brand-border bg-brand-surface p-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-text-muted">What to expect</p>
            <ul className="space-y-2">
              {content.expectations.map((item) => (
                <li key={item} className="text-sm text-brand-text leading-relaxed flex gap-2">
                  <span className="text-brand-primary shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <label className="legal-accept-row cursor-pointer">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm text-brand-text leading-relaxed">{content.acknowledgment}</span>
          </label>
          <button
            type="button"
            disabled={!acknowledged || saving}
            onClick={() => void onComplete(jobType)}
            className="app-button-primary w-full disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Complete onboarding'}
          </button>
        </div>
      )}
    </AppFormSheet>
  );
}
