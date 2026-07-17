import React from 'react';
import { Input as BaseInput, type InputProps } from 'baseui/input';

export type GuardrInputProps = InputProps & {
  label?: string;
  hint?: string;
  error?: string;
};

export function GuardrInput({ label, hint, error, overrides, ...rest }: GuardrInputProps) {
  return (
    <BaseInput
      error={Boolean(error)}
      positive={false}
      overrides={{
        Root: {
          style: {
            borderRadius: '12px',
          },
        },
        Input: {
          style: {
            minHeight: 'var(--space-touch, 44px)',
            fontSize: '16px',
          },
        },
        ...overrides,
      }}
      {...rest}
    />
  );
}
