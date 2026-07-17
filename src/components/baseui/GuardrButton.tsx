import React from 'react';
import { Button as BaseButton, KIND, SIZE, type ButtonProps } from 'baseui/button';

export type GuardrButtonKind = 'primary' | 'secondary' | 'tertiary' | 'danger';

const KIND_MAP: Record<GuardrButtonKind, keyof typeof KIND> = {
  primary: 'primary',
  secondary: 'secondary',
  tertiary: 'tertiary',
  danger: 'secondary',
};

export type GuardrButtonProps = Omit<ButtonProps, 'kind' | 'size'> & {
  kind?: GuardrButtonKind;
  size?: 'mini' | 'compact' | 'default' | 'large';
  fullWidth?: boolean;
};

export function GuardrButton({
  kind = 'primary',
  size = 'default',
  fullWidth,
  overrides,
  children,
  ...rest
}: GuardrButtonProps) {
  const sizeMap = {
    mini: SIZE.mini,
    compact: SIZE.compact,
    default: SIZE.default,
    large: SIZE.large,
  };

  const dangerOverrides =
    kind === 'danger'
      ? {
          BaseButton: {
            style: {
              backgroundColor: 'var(--status-danger)',
              color: '#FFFFFF',
              ':hover': { backgroundColor: 'color-mix(in srgb, var(--status-danger) 88%, black)' },
            },
          },
        }
      : {};

  return (
    <BaseButton
      kind={KIND[KIND_MAP[kind]]}
      size={sizeMap[size]}
      overrides={{
        ...dangerOverrides,
        ...overrides,
        BaseButton: {
          ...dangerOverrides.BaseButton,
          ...overrides?.BaseButton,
          style: {
            minHeight: 'var(--space-touch, 44px)',
            borderRadius: '8px',
            fontWeight: 600,
            transition: 'transform 150ms cubic-bezier(0.2, 0, 0, 1), box-shadow 150ms ease',
            ...(fullWidth ? { width: '100%' } : {}),
            ...(typeof overrides?.BaseButton?.style === 'object' ? overrides.BaseButton.style : {}),
            ...(typeof dangerOverrides.BaseButton?.style === 'object' ? dangerOverrides.BaseButton.style : {}),
            ':active': {
              transform: 'scale(0.98)',
            },
          },
        },
      }}
      {...rest}
    >
      {children}
    </BaseButton>
  );
}
