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
}: JobBillingSummaryProps) {
  const guardRate =
    guardPayProp ?? (hourlyRate != null ? computeGuardPay(hourlyRate, platformFeePerHour) : 0);
  const guardEarns = Math.round(durationHours * guardRate * 100) / 100;
  const platformRate = platformFeePerHour ?? PLATFORM_FEE_PER_HOUR;
  const platformFee =
    platformFeeTotal ?? Math.round(platformRate * durationHours * 100) / 100;

  if (variant === 'guard') {
    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <BillingMetric label="Guard rate" value={`$${guardRate}/hr`} />
        <BillingMetric label="Guard earns" value={`$${guardEarns}`} accent />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
        <BillingMetric label="Client rate" value={`$${hourlyRate}/hr`} />
        <BillingMetric label="Client bill" value={`$${estimatedPayout}`} />
        <BillingMetric label="Guard rate" value={`$${guardRate}/hr`} />
        <BillingMetric label="Guard earns" value={`$${guardEarns}`} accent />
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-brand-text-muted border-t border-brand-border pt-3">
        <span>
          Platform rate: <strong className="text-brand-text">${platformRate}/hr</strong>
        </span>
        <span>
          Platform fee: <strong className="text-brand-text">${platformFee}</strong>
        </span>
      </div>
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
  job: Pick<GuardJobView, 'guardPay' | 'durationHours'>;
}) {
  return (
    <JobBillingSummary
      variant="guard"
      durationHours={job.durationHours}
      guardPay={job.guardPay}
    />
  );
}
