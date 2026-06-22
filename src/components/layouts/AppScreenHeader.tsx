import React from 'react';
import { LogOut, MapPin } from 'lucide-react';
import { ProfileAvatar } from '../profile/ProfileAvatar';

interface AppScreenHeaderProps {
  title: string;
  subtitle?: string;
  locationLabel?: string;
  avatarUrl?: string;
  avatarName?: string;
  onAvatarClick?: () => void;
  onSignOut?: () => void;
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
  onSignOut,
  right,
  className = '',
}: AppScreenHeaderProps) {
  const showLocation = !!locationLabel;

  return (
    <header
      className={`app-screen-header shrink-0 z-[1002] px-5 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 flex items-center gap-3 border-b border-brand-border bg-brand-bg transition-colors ${className}`}
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

      <div className="shrink-0 flex items-center gap-2">
        {right}
        {(onSignOut || avatarName) && (
          <div className={`flex items-center gap-1 ${right ? 'pl-2 border-l border-brand-border' : ''}`}>
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 h-9 px-2 sm:px-2.5 rounded-lg text-xs font-medium text-brand-text-muted hover:text-brand-text hover:bg-brand-border/20 transition-colors"
                aria-label="Log out"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">Log out</span>
              </button>
            )}
            {avatarName && (
              <button
                type="button"
                onClick={onAvatarClick}
                className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                aria-label="Open profile"
              >
                <ProfileAvatar src={avatarUrl} name={avatarName} size="sm" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
