import React from 'react';
import { GuardrButton, type GuardrButtonKind, type GuardrButtonProps } from '../baseui/GuardrButton';

export type AppButtonVariant = 'primary' | 'outline' | 'danger' | 'ghost';
export type AppButtonSize = 'sm' | 'md' | 'lg' | 'inline';

const VARIANT_MAP: Record<AppButtonVariant, GuardrButtonKind> = {
  primary: 'primary',
  outline: 'secondary',
  danger: 'danger',
  ghost: 'tertiary',
};

const SIZE_MAP: Record<AppButtonSize, GuardrButtonProps['size']> = {
  sm: 'compact',
  md: 'default',
  lg: 'large',
  inline: 'mini',
};

export type AppButtonProps = Omit<GuardrButtonProps, 'kind' | 'size'> & {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  className?: string;
};

/**
 * Unified action button — maps legacy variant names to GuardrButton (Base Web only, no CSS bridge).
 */
export function AppButton({
  variant = 'primary',
  size = 'md',
  className = '',
  fullWidth,
  children,
  ...rest
}: AppButtonProps) {
  return (
    <GuardrButton
      kind={VARIANT_MAP[variant]}
      size={SIZE_MAP[size]}
      fullWidth={fullWidth}
      className={className || undefined}
      {...rest}
    >
      {children}
    </GuardrButton>
  );
}
