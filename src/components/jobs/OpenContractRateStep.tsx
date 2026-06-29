import React, { useMemo, useState } from 'react';
import type { AgreementPlatformFeeConfig } from '../../lib/payments';
import {
  computeJobBilling,
  describePlatformFeeAtRate,
  type PlatformFeeConfig,
} from '../../lib/payments';
import type { PricingMode } from '../../types';
import { PAY_RATE_PRESETS } from '../../lib/clientRequestFlow';
import { AgreementFeeFields } from './AgreementFeeFields';

interface OpenContractRateStepProps {
  feeConfig: PlatformFeeConfig;
  durationHours: number;
  guardsNeeded: number;
  pricingMode: PricingMode;
  onPricingModeChange: (mode: PricingMode) => void;
  hourlyRate: number;
  onHourlyRateChange: (rate: number) => void;
  customRate: string;
  onCustomRateChange: (value: string) => void;
  agreementFeeConfig?: AgreementPlatformFeeConfig;
  onAgreementFeeConfigChange: (value: AgreementPlatformFeeConfig | undefined) => void;
  openingMessage: string;
  onOpeningMessageChange: (value: string) => void;
}

export function OpenContractRateStep({
  feeConfig,
  durationHours,
  guardsNeeded,
  pricingMode,
  onPricingModeChange,
  hourlyRate,
  onHourlyRateChange,
  customRate,
  onCustomRateChange,
  agreementFeeConfig,
  onAgreementFeeConfigChange,
  openingMessage,
  onOpeningMessageChange,
}: OpenContractRateStepProps) {
  const effectiveRate = customRate
    ? Math.max(20, parseInt(customRate, 10) || hourlyRate)
    : hourlyRate;

  const billing = useMemo(
    () =>
      computeJobBilling(
        effectiveRate,
        durationHours,
        guardsNeeded,
        feeConfig,
        agreementFeeConfig
      ),
    [effectiveRate, durationHours, guardsNeeded, feeConfig, agreementFeeConfig]
  );

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-3xl font-black tracking-[-0.04em] leading-tight">Pay rate</h2>
        <p className="text-sm text-brand-text-muted mt-2">
          Choose standard preset rates or open a contract to negotiate directly with guards.
        </p>
      </div>

      <div className="segmented-control segmented-control-full">
        <button
          type="button"
          onClick={() => onPricingModeChange('standard')}
          className={`segmented-control-btn flex-1 py-3 ${
            pricingMode === 'standard' ? 'segmented-control-btn-active' : ''
          }`}
        >
          Standard rate
        </button>
        <button
          type="button"
          onClick={() => onPricingModeChange('open_contract')}
          className={`segmented-control-btn flex-1 py-3 ${
            pricingMode === 'open_contract' ? 'segmented-control-btn-active' : ''
          }`}
        >
          Open contract
        </button>
      </div>

      {pricingMode === 'standard' ? (
        <>
          <div className="segmented-control segmented-control-full">
            {PAY_RATE_PRESETS.map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => {
                  onHourlyRateChange(rate);
                  onCustomRateChange('');
                }}
                className={`segmented-control-btn flex-1 py-3 ${
                  hourlyRate === rate && !customRate ? 'segmented-control-btn-active' : ''
                }`}
              >
                ${rate}/hr
              </button>
            ))}
          </div>
          <div>
            <label className="uber-label block mb-1.5">Custom</label>
            <input
              type="number"
              min={20}
              placeholder="$/hr"
              value={customRate}
              onChange={(e) => onCustomRateChange(e.target.value)}
              className="uber-input rounded-xl"
            />
          </div>
          <p className="text-xs text-brand-text-muted">
            {describePlatformFeeAtRate(effectiveRate, feeConfig)}
          </p>
        </>
      ) : (
        <>
          <div className="rounded-xl border border-brand-primary/30 bg-brand-primary/5 p-4 text-sm text-brand-text-muted leading-relaxed">
            Open contracts let you and the guard negotiate the client rate and platform fee for this
            job. Your opening offer below is a starting point — guards can counter before you hire.
          </div>
          <div>
            <label className="uber-label block mb-1.5">Opening client rate ($/hr)</label>
            <input
              type="number"
              min={20}
              placeholder="e.g. 40"
              value={customRate || (hourlyRate >= 20 ? String(hourlyRate) : '')}
              onChange={(e) => {
                onCustomRateChange(e.target.value);
                const parsed = parseInt(e.target.value, 10);
                if (!Number.isNaN(parsed)) onHourlyRateChange(parsed);
              }}
              className="uber-input rounded-xl"
            />
          </div>
          <AgreementFeeFields
            value={agreementFeeConfig}
            onChange={onAgreementFeeConfigChange}
            allowPlatformDefault
          />
          <div>
            <label className="uber-label block mb-1.5">Note to guards (optional)</label>
            <textarea
              rows={2}
              value={openingMessage}
              onChange={(e) => onOpeningMessageChange(e.target.value)}
              placeholder="Budget context, scope, or terms you want to discuss…"
              className="uber-input resize-none"
            />
          </div>
          {effectiveRate >= 20 && (
            <p className="text-xs text-brand-text-muted">
              Opening offer: ${effectiveRate}/hr client charge ·{' '}
              {describePlatformFeeAtRate(effectiveRate, feeConfig, agreementFeeConfig)} · est. $
              {billing.estimatedPayout.toFixed(2)} total
            </p>
          )}
        </>
      )}
    </div>
  );
}
