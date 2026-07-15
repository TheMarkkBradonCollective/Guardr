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
import { isJobTypeOnboarded } from '../../lib/guardJobTypeOnboarding';
import { AppSwitch } from '../ui/AppSwitch';
import { JobTypeOnboardingSheet } from './JobTypeOnboardingSheet';

interface GuardJobPreferencesPanelProps {
  guard: SecurityGuard;
  onChange: (preferences: JobType[]) => void | Promise<void>;
  onCompleteOnboarding: (jobType: JobType) => void | Promise<void>;
  saving?: boolean;
}

type PreferenceFactorStatus = 'very-high' | 'high' | 'moderate' | 'low';

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

function preferenceFactorStatus(active: boolean, onboarded: boolean): PreferenceFactorStatus {
  if (!onboarded) return 'moderate';
  if (active) return 'very-high';
  return 'low';
}

function preferenceStatusLabel(active: boolean, onboarded: boolean): string {
  if (!onboarded) return 'Setup needed';
  if (active) return 'Alerts on';
  return 'Alerts off';
}

function preferenceFillPercent(active: boolean, onboarded: boolean): number {
  if (!onboarded) return 28;
  if (active) return 100;
  return 0;
}

function preferenceHeroClass(active: number, total: number): string {
  if (active >= Math.ceil(total * 0.6)) return 'guard-tier-hero-professional';
  if (active > 0) return 'guard-tier-hero-rising';
  return 'guard-tier-hero-starting';
}

function PreferenceTypeCard({
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
  const status = preferenceFactorStatus(active, onboarded);
  const fillPercent = preferenceFillPercent(active, onboarded);
  const Icon = JOB_TYPE_ICONS[option.type];

  return (
    <article className={`guard-factor-card guard-pref-factor-card guard-factor-card-${status}`}>
      <div className="guard-pref-factor-card-head">
        <Icon className="guard-pref-factor-card-icon" aria-hidden />
        <p className="guard-factor-card-label">{option.label}</p>
      </div>
      <p className="guard-factor-card-rate">{active ? 'On' : onboarded ? 'Off' : '—'}</p>
      <div className="guard-factor-card-bar" role="presentation" aria-hidden>
        <div className="guard-factor-card-bar-fill" style={{ width: `${fillPercent}%` }} />
      </div>
      <div className="guard-factor-card-footer">
        <span className="guard-factor-card-points guard-pref-factor-card-desc">{option.description}</span>
        <span className={`guard-factor-card-status guard-factor-status-${status}`}>
          <span className="guard-factor-status-dot" />
          {preferenceStatusLabel(active, onboarded)}
        </span>
      </div>
      <div className="guard-pref-factor-card-actions">
        {onboarded ? (
          <AppSwitch
            checked={active}
            disabled={saving || onboardingBusy}
            onChange={onToggle}
            ariaLabel={`${option.label} job alerts`}
          />
        ) : (
          <button
            type="button"
            disabled={saving || onboardingBusy}
            onClick={onSetup}
            className="guard-pref-factor-setup-btn"
          >
            <span>Complete onboarding</span>
            <ChevronRight className="w-4 h-4 shrink-0" aria-hidden />
          </button>
        )}
      </div>
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
    <div className="guard-preferences-panel">
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
        <div className="guard-pref-onboard-progress">
          <div className="guard-tier-progress-track" role="presentation">
            <div
              className="guard-tier-progress-fill"
              style={{ width: `${stats.onboardedPercent}%` }}
            />
          </div>
          <p className="guard-pref-onboard-progress-hint">
            <TrendingUp className="guard-tier-progress-hint-icon" aria-hidden />
            <span>
              <strong>{stats.onboarded}</strong> of {stats.total} types onboarded
              {stats.setupNeeded > 0 ? ` · ${stats.setupNeeded} need setup` : ''}
            </span>
          </p>
        </div>
        <p className="guard-tier-hero-subtitle">
          {stats.active > 0
            ? `Receiving alerts for ${stats.active} job type${stats.active === 1 ? '' : 's'}`
            : 'Complete read-aloud onboarding per type, then turn on alerts'}
        </p>
      </div>

      <div className="guard-pref-body">
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
            <div className="guard-factors-grid">
              {category.types.map((type) => {
                const option = OPTION_BY_TYPE[type];
                const active = selected.has(type);
                const onboarded = isJobTypeOnboarded(guard, type);
                return (
                  <PreferenceTypeCard
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
    </div>
  );
}
