import React, { useMemo, useState } from 'react';
import {
  BellOff,
  Building2,
  ChevronRight,
  ClipboardCheck,
  Flame,
  HardHat,
  KeyRound,
  Music,
  PartyPopper,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Star,
  Truck,
  UserCheck,
  Wine,
} from 'lucide-react';
import type { JobType, SecurityGuard } from '../../types';
import {
  JOB_TYPE_PREFERENCE_CATEGORIES,
  JOB_TYPE_PREFERENCE_OPTIONS,
  normalizeJobTypePreferences,
  type JobTypePreferenceOption,
} from '../../lib/guardJobPreferences';
import { isJobTypeOnboarded, GENERAL_ONBOARDING_INTRO } from '../../lib/guardJobTypeOnboarding';
import { AppSwitch } from '../ui/AppSwitch';
import { JobTypeOnboardingSheet } from './JobTypeOnboardingSheet';

interface GuardJobPreferencesPanelProps {
  guard: SecurityGuard;
  onChange: (preferences: JobType[]) => void | Promise<void>;
  onCompleteOnboarding: (jobType: JobType) => void | Promise<void>;
  saving?: boolean;
}

const JOB_TYPE_ICONS: Record<JobType, React.ComponentType<{ className?: string }>> = {
  'nightclub-bar': Wine,
  'event-wedding': Star,
  'event-concert': Music,
  'event-festival': PartyPopper,
  'event-corporate': Building2,
  'event-private': KeyRound,
  event: Sparkles,
  patrol: Truck,
  construction: HardHat,
  'fire-watch': Flame,
  'standing-guard': Shield,
  bodyguard: UserCheck,
  'armed-escort': Shield,
  'asset-protection': Building2,
  other: ClipboardCheck,
};

const OPTION_BY_TYPE = Object.fromEntries(
  JOB_TYPE_PREFERENCE_OPTIONS.map((option) => [option.type, option])
) as Record<JobType, JobTypePreferenceOption>;

function JobTypeStatusBadge({
  active,
  onboarded,
}: {
  active: boolean;
  onboarded: boolean;
}) {
  if (!onboarded) {
    return <span className="guard-pref-badge guard-pref-badge-setup">Setup needed</span>;
  }
  if (active) {
    return <span className="guard-pref-badge guard-pref-badge-on">Alerts on</span>;
  }
  return <span className="guard-pref-badge guard-pref-badge-off">Alerts off</span>;
}

function OnboardingProgressBar({ onboarded, total }: { onboarded: number; total: number }) {
  const fillPercent = total > 0 ? Math.min(100, Math.round((onboarded / total) * 100)) : 0;

  return (
    <div
      className="guard-pref-progress"
      role="progressbar"
      aria-valuenow={onboarded}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`${onboarded} of ${total} job types onboarded`}
    >
      <div className="guard-pref-progress-track">
        <div
          className={`guard-pref-progress-fill${fillPercent === 0 ? ' guard-pref-progress-fill-empty' : ''}`}
          style={{ width: `${fillPercent}%` }}
        />
      </div>
    </div>
  );
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
  const [welcomeExpanded, setWelcomeExpanded] = useState(false);

  const stats = useMemo(() => {
    const total = JOB_TYPE_PREFERENCE_OPTIONS.length;
    const active = JOB_TYPE_PREFERENCE_OPTIONS.filter((option) => selected.has(option.type)).length;
    const onboarded = JOB_TYPE_PREFERENCE_OPTIONS.filter((option) =>
      isJobTypeOnboarded(guard, option.type)
    ).length;
    const setupNeeded = total - onboarded;
    return { total, active, onboarded, setupNeeded };
  }, [guard, selected]);

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
    <>
      <div className="guard-tiered-screen-pinned">
        <section className="guard-preferences-panel guard-preferences-panel-tiered guard-tier-hero-card">
          <div className="guard-tier-hero guard-pref-hero-tiered guard-tier-hero-dense">
            <div className="guard-pref-hero-glow" aria-hidden />
            <div className="guard-pref-tier-medal" aria-hidden>
              <div className="guard-pref-tier-medal-ring">
                <SlidersHorizontal className="guard-pref-tier-medal-icon" />
              </div>
            </div>
            <p className="guard-tier-hero-eyebrow">Job alerts</p>
            <h2 className="guard-tier-hero-name">Your alert profile</h2>
            <div className="guard-tier-hero-score-row">
              <span className="guard-tier-hero-score-label">Onboarded</span>
              <span className="guard-tier-hero-score-value">
                {stats.onboarded}
                <span className="guard-pref-hero-score-total"> / {stats.total}</span>
              </span>
            </div>
            <OnboardingProgressBar onboarded={stats.onboarded} total={stats.total} />
            <p className="guard-tier-hero-subtitle">
              {stats.active > 0
                ? `${stats.active} alert${stats.active === 1 ? '' : 's'} active right now`
                : stats.setupNeeded > 0
                  ? `${stats.setupNeeded} type${stats.setupNeeded === 1 ? '' : 's'} need setup`
                  : 'Toggle alerts for each job type below'}
            </p>
          </div>
        </section>
      </div>

      <div className="guard-tiered-screen-scroll">
        <div className="guard-pref-body">
        <div className="guard-pref-intro">
          <p className="guard-pref-intro-text">
            Turn on the job types you want. Complete the read-aloud onboarding once per type, then
            toggle alerts anytime.
            {welcomeExpanded ? (
              <span className="guard-pref-intro-welcome"> {GENERAL_ONBOARDING_INTRO}</span>
            ) : null}
          </p>
          <button
            type="button"
            className="guard-pref-intro-read-more"
            onClick={() => setWelcomeExpanded((open) => !open)}
            aria-expanded={welcomeExpanded}
          >
            {welcomeExpanded ? 'Read less' : 'Read more'}
          </button>
        </div>
        {stats.active === 0 && (
          <div className="guard-pref-empty-banner">
            <div className="guard-pref-empty-banner-icon-wrap">
              <BellOff className="guard-pref-empty-banner-icon" aria-hidden />
            </div>
            <div className="guard-pref-empty-banner-copy">
              <p className="guard-pref-empty-banner-title">No alerts enabled yet</p>
              <p className="guard-pref-empty-banner-text">
                Complete onboarding for a job type, then flip the switch to start receiving matching
                jobs.
              </p>
            </div>
          </div>
        )}

        <div className="guard-pref-categories">
          {JOB_TYPE_PREFERENCE_CATEGORIES.map((category) => (
            <section key={category.id} className="guard-pref-category guard-factors-section">
              <header className="guard-factors-header">
                <h3 className="guard-factors-heading">{category.label}</h3>
                <p className="guard-factors-subheading">{category.description}</p>
              </header>
              <div className="guard-pref-type-grid">
                {category.types.map((type) => {
                  const option = OPTION_BY_TYPE[type];
                  const active = selected.has(type);
                  const onboarded = isJobTypeOnboarded(guard, type);
                  const Icon = JOB_TYPE_ICONS[type];
                  return (
                    <article
                      key={type}
                      className={`guard-pref-type-card ${active ? 'guard-pref-type-card-active' : ''} ${
                        !onboarded ? 'guard-pref-type-card-setup' : ''
                      }`}
                    >
                      <div className="guard-pref-type-card-top">
                        <div className="guard-pref-type-icon-wrap" aria-hidden>
                          <Icon className="guard-pref-type-icon" />
                        </div>
                        <div className="guard-pref-type-copy">
                          <div className="guard-pref-type-title-row">
                            <p className="guard-pref-type-title">{option.label}</p>
                            <JobTypeStatusBadge active={active} onboarded={onboarded} />
                          </div>
                          <p className="guard-pref-type-desc">{option.description}</p>
                        </div>
                        <AppSwitch
                          checked={active}
                          disabled={saving || onboardingBusy}
                          onChange={() => handleToggle(type)}
                          ariaLabel={`${option.label} job alerts`}
                        />
                      </div>
                      {!onboarded && (
                        <button
                          type="button"
                          disabled={saving || onboardingBusy}
                          onClick={() => setOnboardingType(type)}
                          className="guard-pref-setup-btn"
                        >
                          <span>Complete onboarding to enable</span>
                          <ChevronRight className="w-4 h-4 shrink-0" aria-hidden />
                        </button>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="guard-performance-stats guard-pref-summary-stats" aria-label="Alert profile summary">
          <div className="guard-performance-stat">
            <p className="guard-performance-stat-label">Active alerts</p>
            <p className="guard-performance-stat-value">{stats.active}</p>
          </div>
          <div className="guard-performance-stat">
            <p className="guard-performance-stat-label">Onboarded</p>
            <p className="guard-performance-stat-value">{stats.onboarded}</p>
          </div>
          <div className="guard-performance-stat">
            <p className="guard-performance-stat-label">Setup needed</p>
            <p className="guard-performance-stat-value">{stats.setupNeeded}</p>
          </div>
          <div className="guard-performance-stat">
            <p className="guard-performance-stat-label">Total types</p>
            <p className="guard-performance-stat-value">{stats.total}</p>
          </div>
        </div>
      </div>
      </div>

      <JobTypeOnboardingSheet
        jobType={onboardingType}
        open={onboardingType != null}
        saving={onboardingBusy}
        onClose={() => setOnboardingType(null)}
        onComplete={handleCompleteOnboarding}
      />
    </>
  );
}
