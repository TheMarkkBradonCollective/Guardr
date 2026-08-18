import React from 'react';
import {
  PLATFORM_FEE_GUARD_TYPE_LABELS,
  PLATFORM_FEE_GUARD_TYPES,
  platformFeeModelLabel,
  resolvePlatformFeePerHour,
  type ClientFeeAccountKind,
  type ClientPlatformFeeSchedule,
  type PlatformFeeConfig,
  type PlatformFeeGuardType,
  type PlatformFeeModel,
} from '../../../lib/platformFees';

interface PlatformFeeScheduleEditorProps {
  accountKind: ClientFeeAccountKind;
  schedule: ClientPlatformFeeSchedule;
  disabled?: boolean;
  onChange: (schedule: ClientPlatformFeeSchedule) => void;
}

function amountFor(config: PlatformFeeConfig): number {
  if (config.model === 'percent') return Math.round(config.percentRate * 1000) / 10;
  return config.flatFeePerHour;
}

export function PlatformFeeScheduleEditor({
  accountKind,
  schedule,
  disabled = false,
  onChange,
}: PlatformFeeScheduleEditorProps) {
  const setModel = (model: PlatformFeeModel) => {
    onChange({ ...schedule, model });
  };

  const setDefaultAmount = (raw: string) => {
    const parsed = parseFloat(raw) || 0;
    if (schedule.model === 'percent') {
      onChange({
        ...schedule,
        percentRate: Math.min(0.5, Math.max(0, parsed / 100)),
      });
      return;
    }
    onChange({ ...schedule, flatFeePerHour: Math.max(0, parsed) });
  };

  const setTypeOverride = (type: PlatformFeeGuardType, raw: string, inherit: boolean) => {
    const next = { ...schedule.byGuardType };
    if (inherit) {
      delete next[type];
      onChange({ ...schedule, byGuardType: next });
      return;
    }
    const parsed = parseFloat(raw) || 0;
    next[type] =
      schedule.model === 'percent'
        ? {
            model: 'percent',
            flatFeePerHour: schedule.flatFeePerHour,
            percentRate: Math.min(0.5, Math.max(0, parsed / 100)),
          }
        : {
            model: 'flat',
            flatFeePerHour: Math.max(0, parsed),
            percentRate: schedule.percentRate,
          };
    onChange({ ...schedule, byGuardType: next });
  };

  const previewRate = 40;
  const defaultFee = resolvePlatformFeePerHour(previewRate, schedule);

  return (
    <div className="space-y-4 min-w-0">
      <p className="text-sm text-brand-text/70 leading-relaxed">
        {accountKind === 'personal'
          ? 'Fees charged when an individual customer requests coverage. Each guard type can use the account default or its own rate.'
          : 'Fees charged when a company or organization requests coverage. Site, event, and protection work can each be priced separately.'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
        <div className="min-w-0">
          <label className="uber-label block mb-1">Fee type</label>
          <select
            className="uber-input w-full"
            value={schedule.model}
            onChange={(e) => setModel(e.target.value as PlatformFeeModel)}
            disabled={disabled}
          >
            <option value="flat">Flat rate ($/hr)</option>
            <option value="percent">Percentage of client charge</option>
          </select>
          <p className="text-xs text-brand-text/60 mt-1">{platformFeeModelLabel(schedule.model)}</p>
        </div>
        <div className="min-w-0">
          <label className="uber-label block mb-1">
            {schedule.model === 'percent' ? 'Default platform take (%)' : 'Default fee per hour ($)'}
          </label>
          <input
            type="number"
            min={0}
            max={schedule.model === 'percent' ? 50 : undefined}
            step={0.5}
            value={schedule.model === 'percent' ? Math.round(schedule.percentRate * 1000) / 10 : schedule.flatFeePerHour}
            onChange={(e) => setDefaultAmount(e.target.value)}
            readOnly={disabled}
            className="uber-input w-full"
          />
          <p className="text-xs text-brand-text/60 mt-1">
            At ${previewRate}/hr this default is ${defaultFee}/hr platform.
          </p>
        </div>
      </div>

      <div className="adm-table-wrap rounded-lg border border-brand-border overflow-x-auto">
        <table className="adm-table w-full text-sm min-w-[28rem]">
          <thead>
            <tr>
              <th>Guard type</th>
              <th>Use default</th>
              <th>{schedule.model === 'percent' ? 'Take %' : '$/hr'}</th>
              <th>At ${previewRate}/hr</th>
            </tr>
          </thead>
          <tbody>
            {PLATFORM_FEE_GUARD_TYPES.map((type) => {
              const override = schedule.byGuardType[type];
              const inherit = !override;
              const config = override ?? schedule;
              const display = amountFor(config);
              const preview = resolvePlatformFeePerHour(previewRate, config);
              return (
                <tr key={type}>
                  <td>{PLATFORM_FEE_GUARD_TYPE_LABELS[type]}</td>
                  <td>
                    <input
                      type="checkbox"
                      checked={inherit}
                      disabled={disabled}
                      onChange={(e) =>
                        setTypeOverride(type, String(display), e.target.checked)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min={0}
                      max={schedule.model === 'percent' ? 50 : undefined}
                      step={0.5}
                      className="uber-input w-24"
                      disabled={disabled || inherit}
                      value={display}
                      onChange={(e) => setTypeOverride(type, e.target.value, false)}
                    />
                  </td>
                  <td className="font-medium">${preview}/hr</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
