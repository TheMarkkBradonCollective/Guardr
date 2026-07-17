/**
 * GuardrProgressBar — Base Web ProgressBar wrapper.
 * https://baseweb.design/components/progress-bar/
 *
 * Uber pattern: black fill on gray track, smooth animation.
 */

import React from 'react';
import { ProgressBar } from './baseuiShims';
import { useStyletron } from 'baseui';

interface GuardrProgressBarProps {
  value: number;
  maxValue?: number;
  label?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const HEIGHT: Record<'sm' | 'md' | 'lg', string> = {
  sm: '4px',
  md: '6px',
  lg: '8px',
};

export function GuardrProgressBar({
  value,
  maxValue = 100,
  label,
  showLabel = false,
  size = 'md',
}: GuardrProgressBarProps) {
  const [, theme] = useStyletron();
  const h = HEIGHT[size];
  const pct = Math.min(100, Math.max(0, (value / maxValue) * 100));

  return (
    <ProgressBar
      value={value}
      maxValue={maxValue}
      showLabel={showLabel}
      getProgressLabel={() => label ?? `${Math.round(pct)}%`}
      overrides={{
        BarContainer: {
          style: {
            backgroundColor: theme.colors.backgroundSecondary,
            borderRadius: '999px',
            height: h,
            overflow: 'hidden',
          },
        },
        Bar: {
          style: {
            backgroundColor: pct >= 100 ? theme.colors.positive : theme.colors.contentPrimary,
            borderRadius: '999px',
            transition: 'width 300ms cubic-bezier(0.16, 1, 0.3, 1)',
          },
        },
        Label: {
          style: {
            fontSize: '12px',
            fontWeight: 600,
            color: theme.colors.contentSecondary,
            marginTop: '6px',
          },
        },
      }}
    />
  );
}
