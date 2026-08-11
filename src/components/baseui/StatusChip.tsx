import React from 'react';

export type StatusTone = 'neutral' | 'positive' | 'negative' | 'warning' | 'info' | 'accent';

export interface StatusChipProps {
  tone?: StatusTone;
  children: React.ReactNode;
  /** Leading dot — Guardr uses it for live/rolling states. */
  dot?: boolean;
  size?: 'small' | 'default';
  className?: string;
}

/**
 * Base Web status pill — tinted background, solid label, used for row and card
 * states (On time / Late / In progress / Completed) across Base Web operations
 * surfaces.
 */
export function StatusChip({
  tone = 'neutral',
  children,
  dot = false,
  size = 'default',
  className = '',
}: StatusChipProps) {
  return (
    <span
      className={`uber-status-chip uber-status-chip--${tone}${size === 'small' ? ' uber-status-chip--sm' : ''} ${className}`.trim()}
    >
      {dot ? <span className="uber-status-chip-dot" aria-hidden /> : null}
      {children}
    </span>
  );
}
