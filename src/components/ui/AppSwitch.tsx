/**
 * AppSwitch — uses Base Web Checkbox (STYLE_TYPE.toggle_round).
 * https://baseweb.design/components/checkbox/
 *
 * Base Web pattern: black track when on, accessible, 44px touch target.
 * `ariaLabel` is for screen readers only — pass `label` for visible text.
 */

import React from 'react';
import { GuardrSwitch } from '../baseui/GuardrSwitch';

interface AppSwitchProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
  /** Optional visible label next to the toggle. Prefer ariaLabel alone when the UI already names the control. */
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
      label={label}
      ariaLabel={ariaLabel}
      size={size}
    />
  );
}
