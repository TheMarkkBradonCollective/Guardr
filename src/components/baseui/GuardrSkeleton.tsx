import React from 'react';
import { Block } from 'baseui/block';
import { MOTION_DURATION, prefersReducedMotion } from '../../theme/motionTokens';

export function GuardrSkeleton({
  width = '100%',
  height = '12px',
  circle = false,
  className,
}: {
  width?: string;
  height?: string;
  circle?: boolean;
  className?: string;
}) {
  const reduced = prefersReducedMotion();
  const duration = reduced ? 0 : MOTION_DURATION.chart;

  return (
    <Block
      className={className}
      width={width}
      height={height}
      backgroundColor="backgroundSecondary"
      overrides={{
        Block: {
          style: {
            borderRadius: circle ? '50%' : '6px',
            animation: duration > 0 ? `guardr-shimmer ${duration}ms ease-in-out infinite` : undefined,
            backgroundImage:
              duration > 0
                ? 'linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--brand-primary) 8%, transparent) 50%, transparent 100%)'
                : undefined,
            backgroundSize: '200% 100%',
          },
        },
      }}
    />
  );
}

/** Inject shimmer keyframes once */
if (typeof document !== 'undefined' && !document.getElementById('guardr-shimmer-style')) {
  const style = document.createElement('style');
  style.id = 'guardr-shimmer-style';
  style.textContent = `
    @keyframes guardr-shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      [class*="guardr-shimmer"] { animation: none !important; }
    }
  `;
  document.head.appendChild(style);
}
