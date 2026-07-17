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

const VARIANT_CLASS: Record<AppButtonVariant, string> = {
  primary: 'app-button-primary',
  outline: 'app-button-outline',
  danger: 'app-button-danger',
  ghost: 'app-button-ghost',
};

const SIZE_CLASS: Record<AppButtonSize, string> = {
  sm: 'app-btn-sm',
  md: 'app-btn-md',
  lg: 'app-btn-lg',
  inline: 'app-btn-inline',
};

export type AppButtonProps = Omit<GuardrButtonProps, 'kind' | 'size'> & {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  className?: string;
};

/**
 * Unified Guardr action button — maps legacy `.app-button-*` variants to Base Web.
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
      className={`${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </GuardrButton>
  );
}
