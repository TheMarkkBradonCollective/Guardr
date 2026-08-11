/**
 * GuardrSpinner — Base Web Spinner wrapper.
 * https://baseweb.design/components/spinner/
 *
 * Base Web pattern: minimal black ring spinner.
 */

import React from 'react';
import { Spinner } from './baseuiShims';
import { useStyletron } from 'baseui';

export type GuardrSpinnerSize = 'sm' | 'md' | 'lg';

const SIZE_PX: Record<GuardrSpinnerSize, number> = { sm: 20, md: 32, lg: 48 };

interface GuardrSpinnerProps {
  size?: GuardrSpinnerSize;
  label?: string;
  centered?: boolean;
}

export function GuardrSpinner({
  size = 'md',
  label = 'Loading…',
  centered = false,
}: GuardrSpinnerProps) {
  const [, theme] = useStyletron();
  const px = SIZE_PX[size];

  const inner = (
    <Spinner
      $size={px}
      $borderWidth={size === 'sm' ? 2 : 3}
      $color={theme.colors.contentPrimary}
      title={label}
    />
  );

  if (centered) {
    return (
      <div
        role="status"
        aria-label={label}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          width: '100%',
        }}
      >
        {inner}
      </div>
    );
  }

  return (
    <span role="status" aria-label={label}>
      {inner}
    </span>
  );
}
