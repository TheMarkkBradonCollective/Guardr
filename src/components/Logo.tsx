import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
  /** transparent PNG (default) or opaque JPG on black */
  variant?: 'transparent' | 'opaque';
}

export function Logo({ className = '', size = 20, variant = 'transparent' }: LogoProps) {
  const src = variant === 'opaque' ? '/logo.jpg' : '/logo.png';
  const srcSet =
    variant === 'transparent'
      ? '/logo-64.png 64w, /logo-128.png 128w, /logo-256.png 256w, /logo.png 512w'
      : undefined;

  return (
    <img
      src={src}
      srcSet={srcSet}
      sizes={typeof size === 'number' ? `${size}px` : undefined}
      alt="Guardr"
      width={size}
      height={size}
      className={`object-contain shrink-0 select-none ${className}`}
      draggable={false}
    />
  );
}
