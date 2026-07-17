import React from 'react';
import { Button as BaseButton, KIND, SIZE, type ButtonProps } from 'baseui/button';
import { useStyletron } from 'baseui';

export type GuardrButtonKind = 'primary' | 'secondary' | 'tertiary' | 'danger';

const KIND_MAP: Record<GuardrButtonKind, keyof typeof KIND> = {
  primary:   'primary',
  secondary: 'secondary',
  tertiary:  'tertiary',
  danger:    'secondary',
};

export type GuardrButtonProps = Omit<ButtonProps, 'kind' | 'size'> & {
  kind?: GuardrButtonKind;
  size?: 'mini' | 'compact' | 'default' | 'large';
  fullWidth?: boolean;
  className?: string;
};

/**
 * Guardr button — real Uber app style.
 * Primary: solid black (#000) → full-width rounded rectangle, 48px min.
 * Secondary: outlined, pill shape.
 * Tertiary: ghost, no border.
 */
export function GuardrButton({
  kind = 'primary',
  size = 'default',
  fullWidth,
  className,
  overrides,
  children,
  ...rest
}: GuardrButtonProps) {
  const [, theme] = useStyletron();

  const sizeMap = {
    mini:    SIZE.mini,
    compact: SIZE.compact,
    default: SIZE.default,
    large:   SIZE.large,
  };

  const isDanger = kind === 'danger';

  const primaryStyle = {
    backgroundColor: theme.colors.contentPrimary,   // black in light, white in dark
    color:           theme.colors.contentInversePrimary,
    border:          'none',
    borderRadius:    '8px',
    fontWeight:      600,
    ':hover': {
      backgroundColor: theme.colors.contentSecondary,
    },
  };

  const secondaryStyle = {
    backgroundColor: 'transparent',
    color:           theme.colors.contentPrimary,
    border:          `1.5px solid ${theme.colors.contentPrimary}`,
    borderRadius:    '8px',
    fontWeight:      600,
    ':hover': {
      backgroundColor: theme.colors.backgroundSecondary,
    },
  };

  const dangerStyle = {
    backgroundColor: theme.colors.negative,
    color:           '#FFFFFF',
    border:          'none',
    borderRadius:    '8px',
    fontWeight:      600,
    ':hover': {
      backgroundColor: `color-mix(in srgb, ${theme.colors.negative} 88%, #000)`,
    },
  };

  const tertiarySyle = {
    backgroundColor: 'transparent',
    color:           theme.colors.contentPrimary,
    border:          'none',
    borderRadius:    '8px',
    fontWeight:      600,
    ':hover': {
      backgroundColor: theme.colors.backgroundSecondary,
    },
  };

  const kindStyle =
    kind === 'primary'   ? primaryStyle  :
    kind === 'secondary' ? secondaryStyle :
    kind === 'danger'    ? dangerStyle   :
    tertiarySyle;

  return (
    <BaseButton
      kind={KIND[isDanger ? 'secondary' : KIND_MAP[kind]]}
      size={sizeMap[size]}
      overrides={{
        BaseButton: {
          props: { className },
          style: {
            minHeight: '48px',
            letterSpacing: '-0.01em',
            transition: 'background-color 120ms ease, transform 120ms ease, opacity 120ms ease',
            ...(fullWidth ? { width: '100%' } : {}),
            ...kindStyle,
            ':active': {
              transform: 'scale(0.97)',
            },
            ...(typeof overrides?.BaseButton?.style === 'object' ? overrides.BaseButton.style : {}),
          },
          ...overrides?.BaseButton,
        },
        ...overrides,
      }}
      {...rest}
    >
      {children}
    </BaseButton>
  );
}
