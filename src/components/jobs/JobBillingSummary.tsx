import React from 'react';
import { SecurityRequest } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { computeGuardPay, PLATFORM_FEE_PER_HOUR } from '../../lib/payments';

export type JobBillingVariant = 'staff' | 'client' | 'guard';

interface JobBillingSummaryProps {
  variant?: JobBillingVariant;
  hourlyRate?: number;
  durationHours: number;
  estimatedPayout?: number;
  guardPay?: number;
  platformFeePerHour?: number;
  platformFeeTotal?: number;
  guardsNeeded?: number;
}

function BillingMetric({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="wf-metric-label">{label}</p>
      <p className={`wf-metric-value ${accent ? 'text-brand-primary' : ''}`}>{value}</p>
    </div>
  );
}

export function JobBillingSummary({
  variant = 'staff',
  hourlyRate,
  durationHours,
  estimatedPayout,
  guardPay: guardPayProp,
  platformFeePerHour,
  platformFeeTotal,
  guardsNeeded = 1,
}: JobBillingSummaryProps) {
  const guardRate =
    guardPayProp ?? (hourlyRate != null ? computeGuardPay(hourlyRate, platformFeePerHour) : 0);
  const guardCount = Math.max(1, guardsNeeded);
  const guardEarns = Math.round(durationHours * guardRate * guardCount * 100) / 100;
  const platformRate =
    platformFeePerHour ?? (hourlyRate != null ? Math.max(0, hourlyRate - guardRate) : PLATFORM_FEE_PER_HOUR);
  const platformFee =
    platformFeeTotal ?? Math.round(platformRate * durationHours * guardCount * 100) / 100;

  if (variant === 'guard') {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <BillingMetric label="Your rate" value={`$${guardRate.toFixed(2)}/hr`} />
          <BillingMetric label="Your estimated earnings" value={`$${guardEarns.toFixed(2)}`} accent />
        </div>
        {hourlyRate != null && (
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-brand-text-muted border-t border-brand-border pt-2">
            <span>Agreed client rate: <strong className="text-brand-text">${hourlyRate.toFixed(2)}/hr</strong></span>
            <span>Platform fee: <strong className="text-brand-text">${platformRate.toFixed(2)}/hr</strong></span>
          </div>
        )}
        <p className="text-[11px] text-brand-text-muted">Your rate is the client rate less the disclosed platform fee. The saved job terms control this assignment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
        <BillingMetric label="Client rate" value={`$${(hourlyRate ?? 0).toFixed(2)}/hr`} />
        <BillingMetric label="Client bill" value={`$${(estimatedPayout ?? 0).toFixed(2)}`} />
        <BillingMetric label="Guard rate" value={`${guardRate.toFixed(2)}/hr`} />
        <BillingMetric label="Total guard earnings" value={`${guardEarns.toFixed(2)}`} accent />
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-brand-text-muted border-t border-brand-border pt-3">
        <span>
          Platform fee per hour: <strong className="text-brand-text">${platformRate.toFixed(2)}/hr</strong>
        </span>
        <span>
          Total platform fee (informational; included in client rate): <strong className="text-brand-text">${platformFee.toFixed(2)}</strong>
        </span>
      </div>
      <p className="text-[11px] text-brand-text-muted">The agreed client rate already includes the platform allocation shown above. These saved job terms do not change when live fee settings are updated.</p>
    </div>
  );
}

export function JobBillingSummaryFromRequest({
  req,
  variant = 'staff',
}: {
  req: SecurityRequest;
  variant?: JobBillingVariant;
}) {
  const hasOvertime = (req.overtimeAmount ?? 0) > 0;
  const scheduledPayout = req.scheduledEstimatedPayout ?? req.estimatedPayout;
  const overtimeSettled = req.overtimeStatus === 'paid';

  return (
    <div className="space-y-3">
      <JobBillingSummary
        variant={variant}
        hourlyRate={req.hourlyRate}
        durationHours={hasOvertime && !overtimeSettled ? (req.scheduledDurationHours ?? req.durationHours) : req.durationHours}
        estimatedPayout={hasOvertime && !overtimeSettled ? scheduledPayout : req.estimatedPayout}
        guardPay={req.guardPay}
        platformFeePerHour={req.platformFeePerHour}
        platformFeeTotal={(req.platformFeePerHour ?? Math.max(0, req.hourlyRate - (req.guardPay ?? computeGuardPay(req.hourlyRate, req.platformFeePerHour)))) * (hasOvertime && !overtimeSettled ? (req.scheduledDurationHours ?? req.durationHours) : req.durationHours) * Math.max(1, req.guardsNeeded ?? 1)}
        guardsNeeded={req.guardsNeeded ?? 1}
      />
      {hasOvertime && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-brand-text-muted border-t border-brand-border pt-3">
          <span>
            Late clock-out: <strong className="text-brand-text">+{req.overtimeHours}h</strong>
          </span>
          <span>
            Overtime charge: <strong className="text-brand-text">+${(req.overtimeAmount ?? 0).toFixed(2)}</strong>
          </span>
          {!overtimeSettled ? (
            <span className="text-amber-400">
              {req.overtimeStatus === 'pending_client' ? 'Awaiting client approval' :
               req.overtimeStatus === 'awaiting_payment' ? 'Client approved — payment pending' :
               req.overtimeStatus === 'disputed' ? 'Disputed — staff reviewing' :
               'Pending approval'}
            </span>
          ) : (
            <span>
              Total bill: <strong className="text-brand-primary">${req.estimatedPayout.toFixed(2)}</strong>
            </span>
          )}
        </div>
      )}
      {!hasOvertime && (req.earlyClockOutRefundAmount ?? 0) > 0 && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm border-t border-brand-border pt-3">
          <span className="text-brand-text-muted">
            Early clock-out: <strong className="text-brand-text">{req.earlyClockOutActualHours}h worked</strong>
            {' '}of {req.durationHours}h scheduled
          </span>
          <span className="text-emerald-600 dark:text-emerald-400">
            Client refund due: <strong>-${(req.earlyClockOutRefundAmount ?? 0).toFixed(2)}</strong>
          </span>
          {req.earlyClockOutRefundStatus === 'pending' && (
            <span className="text-amber-400">Refund pending — staff to process</span>
          )}
          {req.earlyClockOutRefundStatus === 'returned_stripe' && (
            <span className="text-emerald-600 dark:text-emerald-400">Refunded via Stripe</span>
          )}
          {req.earlyClockOutRefundStatus === 'returned_cash' && (
            <span className="text-emerald-600 dark:text-emerald-400">Refunded</span>
          )}
        </div>
      )}
    </div>
  );
}

export function JobBillingSummaryFromGuardJob({
  job,
}: {
  job: Pick<GuardJobView, 'guardPay' | 'durationHours' | 'hourlyRate' | 'platformFeePerHour'>;
}) {
  return (
    <JobBillingSummary
      variant="guard"
      durationHours={job.durationHours}
      hourlyRate={job.hourlyRate}
      platformFeePerHour={job.platformFeePerHour}
      guardPay={job.guardPay}
    />
  );
}
