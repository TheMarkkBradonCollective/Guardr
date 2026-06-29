import React from 'react';
import type { AgreementPlatformFeeConfig } from '../../lib/payments';
import { platformFeeModelLabel } from '../../lib/payments';

interface AgreementFeeFieldsProps {
  value?: AgreementPlatformFeeConfig;
  onChange: (value: AgreementPlatformFeeConfig | undefined) => void;
  disabled?: boolean;
  /** When true, user can clear custom fee and use platform default */
  allowPlatformDefault?: boolean;
  label?: string;
}

export function AgreementFeeFields({
  value,
  onChange,
  disabled = false,
  allowPlatformDefault = true,
  label = 'Platform fee for this agreement',
}: AgreementFeeFieldsProps) {
  const useCustom = !!value;
  const model = value?.model ?? 'flat';

  return (
    <div className="space-y-3">
      <p className="uber-label">{label}</p>
      {allowPlatformDefault && (
        <div className="segmented-control segmented-control-full">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(undefined)}
            className={`segmented-control-btn flex-1 ${!useCustom ? 'segmented-control-btn-active' : ''}`}
          >
            Platform default
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              onChange(
                value ?? {
                  model: 'flat',
                  flatFeePerHour: 5,
                }
              )
            }
            className={`segmented-control-btn flex-1 ${useCustom ? 'segmented-control-btn-active' : ''}`}
          >
            Custom for this deal
          </button>
        </div>
      )}

      {useCustom && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="uber-label block mb-1">Fee type</label>
            <select
              className="uber-input w-full"
              value={model}
              disabled={disabled}
              onChange={(e) => {
                const nextModel = e.target.value as 'flat' | 'percent';
                onChange(
                  nextModel === 'flat'
                    ? { model: 'flat', flatFeePerHour: value?.flatFeePerHour ?? 5 }
                    : { model: 'percent', percentRate: value?.percentRate ?? 0.15 }
                );
              }}
            >
              <option value="flat">Flat rate ($/hr)</option>
              <option value="percent">Percentage of charge</option>
            </select>
            <p className="text-xs text-brand-text-muted mt-1">{platformFeeModelLabel(model)}</p>
          </div>
          {model === 'flat' ? (
            <div>
              <label className="uber-label block mb-1">Fee per hour ($)</label>
              <input
                type="number"
                min={0}
                step={0.5}
                disabled={disabled}
                value={value?.flatFeePerHour ?? 0}
                onChange={(e) =>
                  onChange({
                    model: 'flat',
                    flatFeePerHour: Math.max(0, parseFloat(e.target.value) || 0),
                  })
                }
                className="uber-input w-full"
              />
            </div>
          ) : (
            <div>
              <label className="uber-label block mb-1">Platform take (%)</label>
              <input
                type="number"
                min={0}
                max={50}
                step={0.5}
                disabled={disabled}
                value={Math.round((value?.percentRate ?? 0) * 1000) / 10}
                onChange={(e) =>
                  onChange({
                    model: 'percent',
                    percentRate: Math.min(0.5, Math.max(0, (parseFloat(e.target.value) || 0) / 100)),
                  })
                }
                className="uber-input w-full"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
