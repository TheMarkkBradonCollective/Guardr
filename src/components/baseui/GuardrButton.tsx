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

type BaseButtonOverride = NonNullable<NonNullable<ButtonProps['overrides']>['BaseButton']>;

function mergeButtonClassName(
  className: string | undefined,
  overrideProps: Record<string, unknown> | undefined
): string | undefined {
  const fromOverride =
    typeof overrideProps?.className === 'string' ? overrideProps.className.trim() : '';
  const merged = [className?.trim(), fromOverride].filter(Boolean).join(' ');
  return merged || undefined;
}

function plainStyleObject(
  style: BaseButtonOverride extends { style?: infer S } ? S : unknown
): Record<string, unknown> {
  if (style && typeof style === 'object' && !Array.isArray(style) && typeof style !== 'function') {
    return style as Record<string, unknown>;
  }
  return {};
}

/**
 * Guardr button — Production Guardr app style.
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
    backgroundColor: theme.colors.buttonPrimaryFill,
    color:           theme.colors.buttonPrimaryText,
    border:          'none',
    borderRadius:    '8px',
    fontWeight:      600,
    ':hover': {
      backgroundColor: theme.colors.buttonPrimaryHover,
    },
    ':active': {
      backgroundColor: theme.colors.buttonPrimaryActive,
    },
  };

  const secondaryStyle = {
    backgroundColor: 'transparent',
    color:           theme.colors.contentPrimary,
    border:          `1px solid ${theme.colors.contentPrimary}`,
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

  const { BaseButton: baseButtonOverride, ...restOverrides } = overrides ?? {};
  const overrideProps =
    baseButtonOverride &&
    typeof baseButtonOverride === 'object' &&
    'props' in baseButtonOverride &&
    baseButtonOverride.props &&
    typeof baseButtonOverride.props === 'object'
      ? (baseButtonOverride.props as Record<string, unknown>)
      : undefined;
  const overrideStyle =
    baseButtonOverride && typeof baseButtonOverride === 'object' && 'style' in baseButtonOverride
      ? baseButtonOverride.style
      : undefined;

  return (
    <BaseButton
      kind={KIND[isDanger ? 'secondary' : KIND_MAP[kind]]}
      size={sizeMap[size]}
      overrides={{
        ...restOverrides,
        BaseButton: {
          ...baseButtonOverride,
          props: {
            ...overrideProps,
            className: mergeButtonClassName(className, overrideProps),
          },
          style: {
            minHeight: '48px',
            letterSpacing: '-0.01em',
            transition: 'background-color 120ms ease, transform 120ms ease, opacity 120ms ease',
            ...(fullWidth ? { width: '100%' } : {}),
            ...kindStyle,
            ':active': {
              transform: 'scale(0.97)',
            },
            ...plainStyleObject(overrideStyle),
          },
        },
      }}
      {...rest}
    >
      {children}
    </BaseButton>
  );
}
