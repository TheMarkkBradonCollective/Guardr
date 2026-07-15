import React from 'react';

interface AppSwitchProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
}

export function AppSwitch({ checked, disabled = false, onChange, ariaLabel }: AppSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`app-switch ${checked ? 'app-switch-on' : ''} disabled:opacity-50`}
    />
  );
}
