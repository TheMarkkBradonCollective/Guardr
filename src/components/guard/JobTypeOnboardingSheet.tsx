import React, { useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { JobType } from '../../types';
import {
  jobTypeOnboardingContent,
  jobTypeOnboardingRequiredMs,
  jobTypeOnboardingSpeechText,
  formatOnboardingRemaining,
} from '../../lib/guardJobTypeOnboarding';
import { jobTypePreferenceLabel } from '../../lib/guardJobPreferences';
import { useJobTypeOnboardingReader } from '../../hooks/useJobTypeOnboardingReader';
import { AppFormSheet } from '../ui/app/AppFormSheet';

interface JobTypeOnboardingSheetProps {
  jobType: JobType | null;
  open: boolean;
  saving?: boolean;
  onClose: () => void;
  onComplete: (jobType: JobType) => void | Promise<void>;
}

function OnboardingBulletList({ items }: { items: string[] }) {
  return (
    <ul className="guard-pref-onboarding-list">
      {items.map((item) => (
        <li key={item} className="guard-pref-onboarding-list-item">
          <CheckCircle2 className="guard-pref-onboarding-check" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function JobTypeOnboardingSheet({
  jobType,
  open,
  saving = false,
  onComplete,
  onClose,
}: JobTypeOnboardingSheetProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  const content = jobType ? jobTypeOnboardingContent(jobType) : null;
  const speechText = jobType ? jobTypeOnboardingSpeechText(jobType) : '';
  const requiredMs = jobType ? jobTypeOnboardingRequiredMs(jobType) : 0;

  const reader = useJobTypeOnboardingReader({
    speechText,
    requiredMs,
    active: open && jobType != null,
  });

  const handleClose = () => {
    setAcknowledged(false);
    reader.reset();
    onClose();
  };

  const canComplete = acknowledged && reader.readComplete && !saving;

  return (
    <AppFormSheet
      open={open}
      onClose={handleClose}
      title={content?.title ?? jobTypePreferenceLabel(jobType ?? 'other')}
      subtitle="Listen to the full briefing before accepting this job type."
    >
      {content && jobType && (
        <div className="guard-pref-onboarding">
          <div className="guard-pref-onboarding-reader" aria-live="polite">
            <div className="guard-pref-onboarding-reader-top">
              <p className="guard-pref-onboarding-reader-label">Read-aloud briefing</p>
              <p className="guard-pref-onboarding-reader-status">
                {reader.readComplete
                  ? 'Briefing complete — you may finish onboarding.'
                  : `${formatOnboardingRemaining(reader.remainingMs)} remaining`}
              </p>
            </div>

            <div
              className="guard-pref-onboarding-reader-progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={reader.progressPct}
              aria-label="Briefing progress"
            >
              <div
                className="guard-pref-onboarding-reader-progress-fill"
                style={{ width: `${reader.progressPct}%` }}
              />
            </div>

            <div className="guard-pref-onboarding-reader-controls">
              {reader.isPlaying && !reader.isPaused ? (
                <button
                  type="button"
                  className="guard-pref-onboarding-reader-btn"
                  onClick={reader.pause}
                  aria-label="Pause briefing"
                >
                  <Pause className="w-4 h-4" aria-hidden />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="guard-pref-onboarding-reader-btn"
                  onClick={reader.play}
                  aria-label="Play briefing"
                >
                  <Play className="w-4 h-4" aria-hidden />
                  <span>{reader.isPaused ? 'Resume' : 'Play'}</span>
                </button>
              )}

              <button
                type="button"
                className={`guard-pref-onboarding-reader-btn ${reader.isMuted ? 'guard-pref-onboarding-reader-btn-muted' : ''}`}
                onClick={reader.toggleMute}
                aria-label={reader.isMuted ? 'Unmute briefing' : 'Mute briefing'}
                aria-pressed={reader.isMuted}
              >
                {reader.isMuted ? (
                  <VolumeX className="w-4 h-4" aria-hidden />
                ) : (
                  <Volume2 className="w-4 h-4" aria-hidden />
                )}
                <span>{reader.isMuted ? 'Unmute' : 'Mute'}</span>
              </button>
            </div>

            <p className="guard-pref-onboarding-reader-hint">
              {reader.speechSupported
                ? 'Guardr reads this briefing aloud. You can mute or pause playback, but you must remain on this screen until the timer completes. Closing early restarts the briefing.'
                : 'Read the full briefing below. You must remain on this screen until the timer completes. Closing early restarts the briefing.'}
            </p>
          </div>

          <div className="guard-pref-onboarding-intro">
            <div className="guard-pref-onboarding-icon-wrap" aria-hidden>
              <ClipboardList className="guard-pref-onboarding-icon" />
            </div>
            <p className="guard-pref-onboarding-summary">{content.summary}</p>
          </div>

          <div className="guard-pref-onboarding-expectations">
            <p className="guard-pref-onboarding-expectations-title">What to expect</p>
            <OnboardingBulletList items={content.expectations} />
          </div>

          <div className="guard-pref-onboarding-expectations guard-pref-onboarding-before">
            <p className="guard-pref-onboarding-expectations-title">Before accepting</p>
            <OnboardingBulletList items={content.beforeAccepting} />
          </div>

          <label className="legal-accept-row cursor-pointer guard-pref-onboarding-ack">
            <input
              type="checkbox"
              checked={acknowledged}
              disabled={!reader.readComplete}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1"
            />
            <span className="text-sm text-brand-text leading-relaxed">{content.acknowledgment}</span>
          </label>

          {!reader.readComplete && (
            <p className="guard-pref-onboarding-wait-note">
              Complete the read-aloud briefing to enable acknowledgment.
            </p>
          )}

          <button
            type="button"
            disabled={!canComplete}
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
