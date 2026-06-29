import React, { useMemo, useState } from 'react';
import type { AgreementPlatformFeeConfig, PlatformFeeConfig } from '../../lib/payments';
import { computeJobBilling, describePlatformFeeAtRate } from '../../lib/payments';
import {
  describeAgreementFee,
  getActivePriceOffer,
  getAgreedPriceOffer,
  getGuardNegotiation,
} from '../../lib/agreementPricing';
import type { AgreementPlatformFeeConfig, GuardPriceNegotiation, OpeningPriceOffer } from '../../types';
import { AgreementFeeFields } from './AgreementFeeFields';
import { Check, MessageSquare } from 'lucide-react';

interface PriceNegotiationJobContext {
  durationHours: number;
  guardsNeeded?: number;
  hourlyRate: number;
  openingPriceOffer?: OpeningPriceOffer;
  priceNegotiations?: GuardPriceNegotiation[];
  agreementFeeConfig?: AgreementPlatformFeeConfig;
}

interface PriceNegotiationPanelProps {
  job: PriceNegotiationJobContext;
  guardId: string;
  guardName?: string;
  viewerRole: 'client' | 'guard';
  feeConfig: PlatformFeeConfig;
  onSubmitOffer?: (input: {
    hourlyRate: number;
    agreementFeeConfig?: AgreementPlatformFeeConfig;
    message?: string;
  }) => void | Promise<void>;
  onAcceptOffer?: (offerId: string) => void | Promise<void>;
  busy?: boolean;
}

export function PriceNegotiationPanel({
  job,
  guardId,
  guardName,
  viewerRole,
  feeConfig,
  onSubmitOffer,
  onAcceptOffer,
  busy = false,
}: PriceNegotiationPanelProps) {
  const negotiation = getGuardNegotiation(job.priceNegotiations, guardId);
  const activeOffer = getActivePriceOffer(negotiation);
  const agreedOffer = getAgreedPriceOffer(negotiation);

  const [hourlyRate, setHourlyRate] = useState(
    String(activeOffer?.hourlyRate ?? job.openingPriceOffer?.hourlyRate ?? job.hourlyRate ?? 30)
  );
  const [agreementFeeConfig, setAgreementFeeConfig] = useState<
    AgreementPlatformFeeConfig | undefined
  >(
    activeOffer?.agreementFeeConfig ??
      job.openingPriceOffer?.agreementFeeConfig ??
      job.agreementFeeConfig
  );
  const [message, setMessage] = useState('');

  const previewRate = Math.max(0, parseInt(hourlyRate, 10) || 0);
  const preview = useMemo(
    () =>
      computeJobBilling(
        previewRate,
        job.durationHours,
        job.guardsNeeded ?? 1,
        feeConfig,
        agreementFeeConfig
      ),
    [previewRate, job.durationHours, job.guardsNeeded, feeConfig, agreementFeeConfig]
  );

  const canRespond =
    activeOffer &&
    activeOffer.status === 'pending' &&
    activeOffer.offeredBy !== viewerRole;

  const showComposer =
    !agreedOffer &&
    (!activeOffer || activeOffer.offeredBy === viewerRole || canRespond);

  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-4 space-y-4">
      <div className="flex items-start gap-2">
        <MessageSquare className="w-4 h-4 text-brand-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold">Open contract pricing</p>
          <p className="text-xs text-brand-text-muted mt-0.5">
            {guardName
              ? `Negotiate rate and platform fee with ${guardName}.`
              : 'Negotiate the client rate and platform fee for this job.'}
          </p>
        </div>
      </div>

      {job.openingPriceOffer && !negotiation && (
        <div className="text-xs text-brand-text-muted rounded-lg bg-brand-bg-sec p-3">
          Client opening offer: ${job.openingPriceOffer.hourlyRate}/hr
          {job.openingPriceOffer.agreementFeeConfig
            ? ` · ${describeAgreementFee(job.openingPriceOffer.agreementFeeConfig)}`
            : ' · platform default fee'}
          {job.openingPriceOffer.message ? ` — "${job.openingPriceOffer.message}"` : ''}
        </div>
      )}

      {(negotiation?.offers ?? []).length > 0 && (
        <div className="space-y-2">
          {[...(negotiation?.offers ?? [])].reverse().slice(0, 4).map((offer) => (
            <div
              key={offer.id}
              className={`rounded-lg border px-3 py-2 text-xs ${
                offer.status === 'pending'
                  ? 'border-brand-primary/40 bg-brand-primary/5'
                  : offer.status === 'accepted'
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-brand-border bg-brand-bg-sec opacity-70'
              }`}
            >
              <p className="font-semibold capitalize">
                {offer.offeredBy} · ${offer.hourlyRate}/hr
                {offer.agreementFeeConfig
                  ? ` · ${describeAgreementFee(offer.agreementFeeConfig)}`
                  : ''}
                {offer.status === 'pending' ? ' · pending' : ''}
                {offer.status === 'accepted' ? ' · agreed' : ''}
              </p>
              {offer.message && <p className="text-brand-text-muted mt-1">{offer.message}</p>}
            </div>
          ))}
        </div>
      )}

      {agreedOffer && (
        <div className="flex items-center gap-2 text-sm text-emerald-500 font-medium">
          <Check className="w-4 h-4" />
          Agreed: ${agreedOffer.hourlyRate}/hr · guard ${preview.guardPay}/hr · platform $
          {preview.platformFeePerHour}/hr
        </div>
      )}

      {canRespond && onAcceptOffer && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void onAcceptOffer(activeOffer!.id)}
          className="app-button-primary !w-full !h-10"
        >
          Accept ${activeOffer!.hourlyRate}/hr offer
        </button>
      )}

      {showComposer && onSubmitOffer && (
        <div className="space-y-3 border-t border-brand-border pt-3">
          <div>
            <label className="uber-label block mb-1">Proposed client rate ($/hr)</label>
            <input
              type="number"
              min={20}
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              className="uber-input w-full"
              disabled={busy}
            />
          </div>
          <AgreementFeeFields
            value={agreementFeeConfig}
            onChange={setAgreementFeeConfig}
            disabled={busy}
          />
          <div>
            <label className="uber-label block mb-1">Message (optional)</label>
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="uber-input resize-none w-full"
              disabled={busy}
            />
          </div>
          {previewRate >= 20 && (
            <p className="text-xs text-brand-text-muted">
              {describePlatformFeeAtRate(previewRate, feeConfig, agreementFeeConfig)}
            </p>
          )}
          <button
            type="button"
            disabled={busy || previewRate < 20}
            onClick={() =>
              void onSubmitOffer({
                hourlyRate: previewRate,
                agreementFeeConfig,
                message: message.trim() || undefined,
              })
            }
            className="app-button-outline !w-full !h-10"
          >
            {canRespond ? 'Send counter-offer' : 'Submit offer'}
          </button>
        </div>
      )}
    </div>
  );
}
