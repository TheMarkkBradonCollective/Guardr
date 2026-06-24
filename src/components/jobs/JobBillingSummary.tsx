import React from 'react';
import { SecurityRequest } from '../../types';
import { GuardJobView } from '../../lib/guardJobView';
import { computeGuardPay, PLATFORM_FEE_PER_HOUR } from '../../lib/payments';
import {
  computeCrewTeamPayBumpBreakdown,
  effectiveGuardPayForJob,
  guardQualifiesForCrewPayBumpOnJob,
  jobHasCrewTeamPayBump,
} from '../../lib/crewTeamBilling';
import type { PlatformSettings } from '../../lib/platformSettings';
import { Users } from 'lucide-react';

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
    guardPayProp ?? (hourlyRate != null ? computeGuardPay(hourlyRate) : 0);
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

export function CrewTeamUpcostNotice({
  req,
  crewSettings,
  variant = 'client',
}: {
  req: Pick<SecurityRequest, 'guardsNeeded' | 'teamLeadId' | 'guardSlots' | 'durationHours' | 'status'>;
  crewSettings?: PlatformSettings;
  variant?: 'client' | 'compact';
}) {
  if (!crewSettings || !jobHasCrewTeamPayBump(req)) return null;
  const bump = computeCrewTeamPayBumpBreakdown(crewSettings, req);
  if (!bump || bump.totalUpcost <= 0) return null;

  const pendingCrew = (req.guardSlots ?? []).every((s) => s.status === 'pending_client') &&
    (req.guardSlots ?? []).some((s) => s.status === 'pending_client');
  const isCompact = variant === 'compact';

  return (
    <div
      className={`rounded-xl border border-amber-500/30 bg-amber-500/10 ${
        isCompact ? 'px-3 py-2.5' : 'px-3 py-3'
      } space-y-1.5`}
    >
      <div className="flex items-start gap-2">
        <Users className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-text">
            All-in-one crew premium
          </p>
          <p className="text-xs text-brand-text-muted mt-0.5 leading-relaxed">
            {pendingCrew
              ? 'This coordinated crew is requesting your approval. Each guard on this crew earns an additional '
              : 'Each guard on this job\'s coordinated crew earns an additional '}
            <strong className="text-brand-text">${bump.perGuardPerHour}/hr</strong>
            {' '}for working as a unified team — added to your total job cost.
          </p>
          <p className="text-xs text-amber-400/95 mt-1.5 font-medium">
            Estimated crew upcost: +${bump.totalUpcost.toFixed(2)}
            {' '}
            <span className="font-normal text-brand-text-muted">
              (${bump.perGuardPerHour}/hr × {bump.guardCount} guard{bump.guardCount === 1 ? '' : 's'} × {bump.durationHours}h)
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export function JobBillingSummaryFromRequest({
  req,
  variant = 'staff',
  crewSettings,
  teamLeadSettings,
  hideCrewUpcostNotice = false,
  guardId,
}: {
  req: SecurityRequest;
  variant?: JobBillingVariant;
  crewSettings?: PlatformSettings;
  /** @deprecated Use crewSettings */
  teamLeadSettings?: PlatformSettings;
  hideCrewUpcostNotice?: boolean;
  /** When set, guard variant shows crew bump only if this guard is on the job roster. */
  guardId?: string;
}) {
  const settings = crewSettings ?? teamLeadSettings;
  const hasOvertime = (req.overtimeAmount ?? 0) > 0;
  const scheduledPayout = req.scheduledEstimatedPayout ?? req.estimatedPayout;
  const overtimeSettled = req.overtimeStatus === 'paid';
  const crewBump = settings ? computeCrewTeamPayBumpBreakdown(settings, req) : null;
  const guardOnCrew = guardQualifiesForCrewPayBumpOnJob(guardId, req);
  const displayGuardPay =
    variant === 'guard' && guardId && settings
      ? effectiveGuardPayForJob(req, guardId, settings)
      : req.guardPay;

  return (
    <div className="space-y-3">
      <JobBillingSummary
        variant={variant}
        hourlyRate={req.hourlyRate}
        durationHours={hasOvertime && !overtimeSettled ? (req.scheduledDurationHours ?? req.durationHours) : req.durationHours}
        estimatedPayout={hasOvertime && !overtimeSettled ? scheduledPayout : req.estimatedPayout}
        guardPay={displayGuardPay}
        platformFeePerHour={req.platformFeePerHour}
      />
      {variant === 'client' && !hideCrewUpcostNotice && crewBump && (
        <CrewTeamUpcostNotice req={req} crewSettings={settings} variant="compact" />
      )}
      {variant === 'guard' && guardOnCrew && crewBump && (
        <p className="text-xs text-brand-primary border-t border-brand-border pt-3">
          +${crewBump.perGuardPerHour}/hr crew pay bump on this job — you are on the coordinated crew roster.
        </p>
      )}
      {hasOvertime && (
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-brand-text-muted border-t border-brand-border pt-3">
          <span>
            Late clock-out: <strong className="text-brand-text">+{req.overtimeHours}h</strong>
          </span>
          <span>
            Overtime charge: <strong className="text-brand-text">+${(req.overtimeAmount ?? 0).toFixed(2)}</strong>
          </span>
          {!overtimeSettled ? (
            <span className="text-amber-400">Pending guard and client approval</span>
          ) : (
            <span>
              Total bill: <strong className="text-brand-primary">${req.estimatedPayout.toFixed(2)}</strong>
            </span>
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
