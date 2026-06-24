import React from 'react';
import { profileInitials } from '../../lib/profilePhoto';

const SIZE_CLASS = {
  xs: 'w-8 h-8 text-[10px]',
  sm: 'w-10 h-10 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-20 h-20 text-2xl',
  '2xl': 'w-24 h-24 text-3xl',
} as const;

type ProfileAvatarSize = keyof typeof SIZE_CLASS;

interface ProfileAvatarProps {
  src?: string | null;
  name: string;
  size?: ProfileAvatarSize;
  className?: string;
  rounded?: 'full' | 'xl' | 'lg';
}

export function ProfileAvatar({
  src,
  name,
  size = 'md',
  className = '',
  rounded = 'full',
}: ProfileAvatarProps) {
  const roundedClass = rounded === 'full' ? 'rounded-full' : rounded === 'xl' ? 'rounded-xl' : 'rounded-lg';
  const sizeClass = SIZE_CLASS[size];
  const initials = profileInitials(name);

  if (src?.trim()) {
    return (
      <img
        src={src}
        alt={`${name} profile photo`}
        className={`${sizeClass} ${roundedClass} object-cover shrink-0 bg-brand-border/30 ${className}`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className={`${sizeClass} ${roundedClass} shrink-0 bg-brand-primary text-brand-accent-text flex items-center justify-center font-bold ring-2 ring-brand-primary/20 ${className}`}
      aria-hidden
    >
      {initials}
    </div>
  );
}
