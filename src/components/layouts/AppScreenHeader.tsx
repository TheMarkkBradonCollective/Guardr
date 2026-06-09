import React from 'react';
import { MapPin } from 'lucide-react';
import { ProfileAvatar } from '../profile/ProfileAvatar';

interface AppScreenHeaderProps {
  title: string;
  subtitle?: string;
  locationLabel?: string;
  avatarUrl?: string;
  avatarName?: string;
  onAvatarClick?: () => void;
  right?: React.ReactNode;
  className?: string;
}

export function AppScreenHeader({
  title,
  subtitle,
  locationLabel,
  avatarUrl,
  avatarName,
  onAvatarClick,
  right,
  className = '',
}: AppScreenHeaderProps) {
  const showLocation = !!locationLabel;

  return (
    <header
      className={`app-screen-header shrink-0 z-[1002] px-4 sm:px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center gap-3 border-b border-brand-border bg-brand-surface/95 backdrop-blur-xl ${className}`}
    >
      <div className="min-w-0 flex-1">
        {showLocation ? (
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm font-medium text-brand-text max-w-full"
            aria-label={`Location: ${locationLabel}`}
          >
            <MapPin className="w-4 h-4 text-brand-text shrink-0" />
            <span className="truncate">{locationLabel}</span>
          </button>
        ) : subtitle ? (
          <p className="text-xs text-brand-text-muted leading-none truncate">{subtitle}</p>
        ) : null}
        <h1 className="text-lg font-semibold truncate leading-tight mt-0.5">{title}</h1>
      </div>

      {right && <div className="shrink-0 flex items-center gap-2">{right}</div>}

      {avatarName && (
        <button
          type="button"
          onClick={onAvatarClick}
          className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
          aria-label="Profile"
        >
          <ProfileAvatar src={avatarUrl} name={avatarName} size="sm" />
        </button>
      )}
    </header>
  );
}
