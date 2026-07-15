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
    <div className="guard-preferences-panel">
      <div className="guard-pref-hero">
        <div className="guard-pref-hero-glow" aria-hidden />
        <div className="guard-pref-hero-content">
          <div className="guard-pref-hero-icon-wrap" aria-hidden>
            <Bell className="guard-pref-hero-icon" />
          </div>
          <div className="guard-pref-hero-copy">
            <p className="guard-pref-hero-eyebrow">Job alerts</p>
            <h2 className="guard-pref-hero-title">Your alert profile</h2>
            <p className="guard-pref-hero-subtitle">
              Turn on the job types you want. Complete onboarding once per type, then toggle alerts
              anytime.
            </p>
          </div>
        </div>
        <div className="guard-pref-stats" role="list">
          <div className="guard-pref-stat" role="listitem">
            <span className="guard-pref-stat-value">{stats.active}</span>
            <span className="guard-pref-stat-label">Active alerts</span>
          </div>
          <div className="guard-pref-stat" role="listitem">
            <span className="guard-pref-stat-value">{stats.onboarded}</span>
            <span className="guard-pref-stat-label">Onboarded</span>
          </div>
          <div className="guard-pref-stat" role="listitem">
            <span className="guard-pref-stat-value">{stats.setupNeeded}</span>
            <span className="guard-pref-stat-label">Setup needed</span>
          </div>
        </div>
      </div>

      {stats.active === 0 && (
        <div className="guard-pref-empty-banner">
          <BellOff className="guard-pref-empty-banner-icon" aria-hidden />
          <div>
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
          <section key={category.id} className="guard-pref-category">
            <header className="guard-pref-category-header">
              <h3 className="guard-pref-category-title">{category.label}</h3>
              <p className="guard-pref-category-desc">{category.description}</p>
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
