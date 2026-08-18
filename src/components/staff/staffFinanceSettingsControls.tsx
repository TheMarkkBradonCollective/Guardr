import React from 'react';
import { useDevice } from '../../lib/platform';
import { GuardrButton } from '../baseui/GuardrButton';

export function FinanceSettingsSaveRow({
  label,
  busyLabel,
  busy,
  disabled,
  dirty,
  onSave,
  onDiscard,
}: {
  label: string;
  busyLabel: string;
  busy: boolean;
  disabled: boolean;
  dirty: boolean;
  onSave: () => void;
  onDiscard: () => void;
}) {
  const { formFactor } = useDevice();

  if (formFactor === 'desktop') {
    return (
      <div className="staff-payment-settings-actions">
        <GuardrButton kind="primary" size="compact" disabled={disabled || busy} onClick={onSave}>
          {busy ? busyLabel : label}
        </GuardrButton>
        {dirty && (
          <GuardrButton kind="secondary" size="compact" onClick={onDiscard}>
            Discard changes
          </GuardrButton>
        )}
      </div>
    );
  }

  return (
    <div className="staff-payment-settings-actions">
      <button
        type="button"
        className="staff-payment-settings-save"
        disabled={disabled || busy}
        onClick={onSave}
      >
        {busy ? busyLabel : label}
      </button>
      {dirty && (
        <button type="button" className="staff-payment-settings-discard" onClick={onDiscard}>
          Discard changes
        </button>
      )}
    </div>
  );
}
