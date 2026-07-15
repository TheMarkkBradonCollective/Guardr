import React from 'react';
import { AppDashboardHero } from '../ui/app/AppPrimitives';

interface ProfileHeroProps {
  kicker?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  email?: string;
  avatar: React.ReactNode;
  badge?: React.ReactNode;
  status?: React.ReactNode;
  photoControls?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/** Profile header aligned with dashboard overview rhythm — hero, identity row, optional metrics/actions. */
export function ProfileHero({
  kicker,
  title,
  subtitle,
  email,
  avatar,
  badge,
  status,
  photoControls,
  meta,
  actions,
  className = '',
}: ProfileHeroProps) {
  const heroTitle = typeof title === 'string' ? title : 'Profile';

  return (
    <div className={`app-profile-overview ${className}`.trim()}>
      <AppDashboardHero kicker={kicker ?? (typeof subtitle === 'string' ? subtitle : undefined)} title={heroTitle} status={status ?? badge} />

      <div className="app-profile-identity-row">
        <div className="app-profile-avatar-wrap">
          {avatar}
          {photoControls}
        </div>
        <div className="app-profile-identity-copy min-w-0 flex-1">
          {typeof title !== 'string' && <div className="app-profile-hero-name min-w-0">{title}</div>}
          {subtitle && typeof subtitle !== 'string' && (
            <div className="app-profile-hero-subtitle">{subtitle}</div>
          )}
          {email && <p className="app-profile-hero-email">{email}</p>}
        </div>
      </div>

      {meta && <div className="app-profile-meta">{meta}</div>}
      {actions && <div className="app-profile-actions">{actions}</div>}
    </div>
  );
}
