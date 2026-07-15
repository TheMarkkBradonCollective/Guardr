import React from 'react';

interface ProfileHeroProps {
  avatar: React.ReactNode;
  name: React.ReactNode;
  subtitle?: React.ReactNode;
  email?: string;
  badge?: React.ReactNode;
  photoControls?: React.ReactNode;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/** Profile header card — avatar, identity, and quick stats in a polished layout. */
export function ProfileHero({
  avatar,
  name,
  subtitle,
  email,
  badge,
  photoControls,
  meta,
  actions,
  className = '',
}: ProfileHeroProps) {
  return (
    <section className={`app-profile-hero ${className}`.trim()}>
      <div className="app-profile-hero-accent" aria-hidden />
      <div className="app-profile-hero-body">
        <div className="app-profile-hero-identity">
          <div className="app-profile-hero-avatar-wrap">
            {avatar}
            {photoControls}
          </div>
          <div className="app-profile-hero-text min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {typeof name === 'string' ? (
                <h2 className="app-profile-hero-name">{name}</h2>
              ) : (
                <div className="app-profile-hero-name min-w-0">{name}</div>
              )}
              {badge}
            </div>
            {subtitle && <p className="app-profile-hero-subtitle">{subtitle}</p>}
            {email && <p className="app-profile-hero-email">{email}</p>}
          </div>
        </div>
        {meta && <div className="app-profile-hero-meta">{meta}</div>}
        {actions && <div className="app-profile-hero-actions">{actions}</div>}
      </div>
    </section>
  );
}
