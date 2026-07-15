import React, { useState } from 'react';
import { CheckCircle2, ClipboardList } from 'lucide-react';
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
        <div className="guard-pref-onboarding">
          <div className="guard-pref-onboarding-intro">
            <div className="guard-pref-onboarding-icon-wrap" aria-hidden>
              <ClipboardList className="guard-pref-onboarding-icon" />
            </div>
            <p className="guard-pref-onboarding-summary">{content.summary}</p>
          </div>

          <div className="guard-pref-onboarding-expectations">
            <p className="guard-pref-onboarding-expectations-title">What to expect</p>
            <ul className="guard-pref-onboarding-list">
              {content.expectations.map((item) => (
                <li key={item} className="guard-pref-onboarding-list-item">
                  <CheckCircle2 className="guard-pref-onboarding-check" aria-hidden />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <label className="legal-accept-row cursor-pointer guard-pref-onboarding-ack">
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
            className="app-button-primary w-full guard-pref-onboarding-submit disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Complete onboarding'}
          </button>
        </div>
      )}
    </AppFormSheet>
  );
}
