import React from 'react';

interface LogoProps {
  className?: string;
  size?: number | string;
  /**
   * - `mark` — transparent shield icon (default)
   * - `wordmark` — full logo with Guardr text
   * - `opaque` — JPG on black for non-alpha contexts
   */
  variant?: 'mark' | 'wordmark' | 'opaque';
}

export function Logo({ className = '', size = 20, variant = 'mark' }: LogoProps) {
  const numericSize = typeof size === 'number' ? size : parseInt(String(size), 10) || 20;

  if (variant === 'wordmark') {
    const src = '/logo-wordmark.png';
    const srcSet = '/logo-wordmark-128.png 128w, /logo-wordmark-256.png 256w, /logo-wordmark.png 512w';

    return (
      <img
        src={src}
        srcSet={srcSet}
        sizes={`${Math.round(numericSize * 1.1)}px`}
        alt="Guardr"
        height={numericSize}
        className={`object-contain shrink-0 select-none w-auto ${className}`}
        style={{ height: numericSize, width: 'auto' }}
        draggable={false}
      />
    );
  }

  const src = variant === 'opaque' ? '/logo.jpg' : '/logo.png';
  const srcSet =
    variant === 'mark'
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
