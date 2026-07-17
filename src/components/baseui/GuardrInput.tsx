import React from 'react';
import { Input as BaseInput, type InputProps } from 'baseui/input';
import { useStyletron } from 'baseui';

export type GuardrInputProps = InputProps & {
  label?: string;
  hint?: string;
  error?: string;
};

export function GuardrInput({ label, hint, error, overrides, ...rest }: GuardrInputProps) {
  const [, theme] = useStyletron();

  return (
    <BaseInput
      error={Boolean(error)}
      positive={false}
      overrides={{
        Root: {
          style: {
            borderRadius: '12px',
            backgroundColor: theme.colors.backgroundSecondary,
            borderColor: error ? theme.colors.negative : 'transparent',
            ':hover': {
              borderColor: error ? theme.colors.negative : theme.colors.borderOpaque,
            },
          },
        },
        Input: {
          style: {
            minHeight: 'var(--space-touch, 44px)',
            fontSize: '16px', /* Prevent iOS auto-zoom */
            backgroundColor: 'transparent',
            color: theme.colors.contentPrimary,
          },
        },
        InputContainer: {
          style: {
            borderRadius: '12px',
          },
        },
        ...overrides,
      }}
      {...rest}
    />
  );
}
