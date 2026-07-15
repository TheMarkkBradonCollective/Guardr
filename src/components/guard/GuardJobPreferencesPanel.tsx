import React, { useMemo, useState } from 'react';
import {
  Bell,
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
  Sparkles,
  Star,
  TrendingUp,
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

function preferenceHeroClass(active: number, total: number): string {
  if (active >= Math.ceil(total * 0.6)) return 'guard-tier-hero-professional';
  if (active > 0) return 'guard-tier-hero-rising';
  return 'guard-tier-hero-starting';
}

function PreferenceTypeRow({
  option,
  active,
  onboarded,
  saving,
  onboardingBusy,
  onToggle,
  onSetup,
}: {
  option: JobTypePreferenceOption;
  active: boolean;
  onboarded: boolean;
  saving: boolean;
  onboardingBusy: boolean;
  onToggle: () => void;
  onSetup: () => void;
}) {
  const Icon = JOB_TYPE_ICONS[option.type];

  return (
    <article
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
          onChange={onToggle}
          ariaLabel={`${option.label} job alerts`}
        />
      </div>
      {!onboarded && (
        <button
          type="button"
          disabled={saving || onboardingBusy}
          onClick={onSetup}
          className="guard-pref-setup-btn"
        >
          <span>Complete onboarding to enable</span>
          <ChevronRight className="w-4 h-4 shrink-0" aria-hidden />
        </button>
      )}
    </article>
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
    const onboardedPercent = total > 0 ? Math.round((onboarded / total) * 100) : 0;
    return { total, active, onboarded, setupNeeded, onboardedPercent };
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
    <section className="guard-rating-section guard-rating-section-tiered guard-preferences-panel-tiered">
      <div className={`guard-tier-hero guard-pref-tier-hero ${preferenceHeroClass(stats.active, stats.total)}`}>
        <div className="guard-tier-hero-glow" aria-hidden />
        <div className="guard-pref-tier-medal" aria-hidden>
          <div className="guard-pref-tier-medal-ring">
            <Bell className="guard-pref-tier-medal-icon" />
          </div>
        </div>
        <p className="guard-tier-hero-eyebrow">Alert profile</p>
        <h2 className="guard-tier-hero-name">Job preferences</h2>
        <div className="guard-tier-hero-score-row">
          <span className="guard-tier-hero-score-label">Active alerts</span>
          <span className="guard-tier-hero-score-value">
            {stats.active}
            <span className="guard-pref-hero-score-total"> / {stats.total}</span>
          </span>
        </div>
        <div className="guard-pref-tier-welcome-block">
          <p className="guard-tier-hero-subtitle">
            {stats.active > 0
              ? `Receiving alerts for ${stats.active} job type${stats.active === 1 ? '' : 's'}`
              : 'Turn on job types you want. Complete read-aloud onboarding once per type.'}
            {welcomeExpanded ? (
              <span className="guard-pref-tier-welcome"> {GENERAL_ONBOARDING_INTRO}</span>
            ) : null}
          </p>
          <button
            type="button"
            className="guard-pref-hero-read-more"
            onClick={() => setWelcomeExpanded((open) => !open)}
            aria-expanded={welcomeExpanded}
          >
            {welcomeExpanded ? 'Read less' : 'Read more'}
          </button>
        </div>
      </div>

      <div className="guard-pref-body">
        <div
          className="guard-pref-completion-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={stats.onboardedPercent}
          aria-label="Onboarding completion"
        >
          <div className="guard-pref-completion-bar-top">
            <p className="guard-pref-completion-bar-label">Onboarding completion</p>
            <p className="guard-pref-completion-bar-value">
              {stats.onboarded} / {stats.total}
            </p>
          </div>
          <div className="guard-pref-completion-bar-track">
            <div
              className="guard-pref-completion-bar-fill"
              style={{ width: `${stats.onboardedPercent}%` }}
            />
          </div>
          <p className="guard-pref-completion-bar-hint">
            <TrendingUp className="guard-pref-completion-bar-icon" aria-hidden />
            <span>
              {stats.setupNeeded > 0
                ? `${stats.setupNeeded} type${stats.setupNeeded === 1 ? '' : 's'} still need setup`
                : 'All job types onboarded'}
            </span>
          </p>
        </div>

        {stats.active === 0 && (
          <div className="guard-pref-empty-banner">
            <BellOff className="guard-pref-empty-banner-icon" aria-hidden />
            <div>
              <p className="guard-pref-empty-banner-title">No alerts enabled yet</p>
              <p className="guard-pref-empty-banner-text">
                Complete read-aloud onboarding for a job type, then flip the switch to start
                receiving matching jobs.
              </p>
            </div>
          </div>
        )}

        {JOB_TYPE_PREFERENCE_CATEGORIES.map((category) => (
          <section key={category.id} className="guard-factors-section guard-pref-category-section">
            <div className="guard-factors-header">
              <h3 className="guard-factors-heading">{category.label}</h3>
              <p className="guard-factors-subheading">{category.description}</p>
            </div>
            <div className="guard-pref-type-list">
              {category.types.map((type) => {
                const option = OPTION_BY_TYPE[type];
                const active = selected.has(type);
                const onboarded = isJobTypeOnboarded(guard, type);
                return (
                  <PreferenceTypeRow
                    key={type}
                    option={option}
                    active={active}
                    onboarded={onboarded}
                    saving={saving}
                    onboardingBusy={onboardingBusy}
                    onToggle={() => handleToggle(type)}
                    onSetup={() => setOnboardingType(type)}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <JobTypeOnboardingSheet
        jobType={onboardingType}
        open={onboardingType != null}
        saving={onboardingBusy}
        onClose={() => setOnboardingType(null)}
        onComplete={handleCompleteOnboarding}
      />
    </section>
  );
}
