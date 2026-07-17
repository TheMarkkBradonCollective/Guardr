/**
 * AppSwitch — uses Base Web Checkbox (STYLE_TYPE.toggle_round).
 * https://baseweb.design/components/checkbox/
 *
 * Uber pattern: black track when on, accessible, 44px touch target.
 */

import React from 'react';
import { GuardrSwitch } from '../baseui/GuardrSwitch';

interface AppSwitchProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
  label?: string;
  size?: 'sm' | 'md';
}

export function AppSwitch({
  checked,
  disabled = false,
  onChange,
  ariaLabel,
  label,
  size = 'md',
}: AppSwitchProps) {
  return (
    <GuardrSwitch
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      label={label ?? ariaLabel}
      size={size}
    />
  );
}
