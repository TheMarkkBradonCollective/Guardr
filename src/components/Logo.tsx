import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
  /** transparent PNG (default) or opaque JPG on black */
  variant?: 'transparent' | 'opaque';
}

export function Logo({ className = '', size = 20, variant = 'transparent' }: LogoProps) {
  const src = variant === 'opaque' ? '/logo.jpg' : '/logo.png';

  return (
    <img
      src={src}
      alt="Guardr"
      width={size}
      height={size}
      className={`object-contain shrink-0 select-none ${className}`}
      draggable={false}
    />
  );
}
