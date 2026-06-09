import React from 'react';
import { Camera, MapPin } from 'lucide-react';
import { ProfileAvatar } from '../profile/ProfileAvatar';

interface HealthTopBarProps {
  location?: string;
  avatarUrl?: string;
  avatarName?: string;
  onAvatarClick?: () => void;
  showCamera?: boolean;
}

export function HealthTopBar({
  location = 'New York',
  avatarUrl,
  avatarName = 'User',
  onAvatarClick,
  showCamera = true,
}: HealthTopBarProps) {
  return (
    <div className="health-top-bar">
      {showCamera ? (
        <button type="button" className="p-2 -ml-2 text-brand-text" aria-label="Scan">
          <Camera className="w-5 h-5" strokeWidth={1.5} />
        </button>
      ) : (
        <div className="w-9" />
      )}
      <button type="button" className="health-location-btn mx-auto">
        <MapPin className="w-4 h-4" strokeWidth={1.5} />
        {location}
      </button>
      <button
        type="button"
        onClick={onAvatarClick}
        className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
        aria-label="Profile"
      >
        <ProfileAvatar src={avatarUrl} name={avatarName} size="sm" />
      </button>
    </div>
  );
}
