import React, { useEffect, useState } from 'react';
import { GuardJobView } from '../../lib/guardJobView';
import { formatShiftRange } from '../../lib/dates';
import { JobListingProfile } from '../jobs/JobListingProfile';
import { JobBillingSummaryFromGuardJob } from '../jobs/JobBillingSummary';
import { ShiftPeriodStatusBar } from '../shift/ShiftPeriodStatusBar';
import { SlideToConfirm } from '../ui/SlideToConfirm';
import { guardAcknowledgedPostOrders, jobRequiresPostOrdersAck } from '../../lib/postOrdersAck';
import {
  canGuardStartEnRoute,
  enRouteBlockedMessage,
  formatCountdown,
  msUntilEnRouteUnlock,
} from '../../lib/preShiftBriefing';
import { Clock, DollarSign, FileText, Navigation } from 'lucide-react';

interface GuardPreShiftBriefingProps {
  job: GuardJobView;
  guardId: string;
  onStartEnRoute: () => void | Promise<void>;
  onAckPostOrders?: () => void | Promise<void>;
}

export function GuardPreShiftBriefing({
  job,
  guardId,
  onStartEnRoute,
  onAckPostOrders,
}: GuardPreShiftBriefingProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const nowMs = now.getTime();
  const enRouteOpen = canGuardStartEnRoute(job, nowMs);
  const enRouteBlocked = enRouteBlockedMessage(job, nowMs);
  const needsPostOrdersAck = jobRequiresPostOrdersAck(job, guardId);
  const postOrdersAcked = guardAcknowledgedPostOrders(job, guardId);
  const enRouteCountdownMs = msUntilEnRouteUnlock(job.startDate, nowMs);

  const slideBlocked = !enRouteOpen || (needsPostOrdersAck && !postOrdersAcked);
  const slideHint =
    needsPostOrdersAck && !postOrdersAcked
      ? 'Acknowledge post orders below before heading to site.'
      : enRouteBlocked ?? 'Review the briefing, then start heading when the slide unlocks.';

  return (
    <div className="absolute inset-x-0 bottom-0 z-[1001] guardr-bottom-sheet guardr-active-shift rounded-t-2xl flex flex-col overflow-hidden">
      <div className="w-10 h-1 rounded-full sheet-handle mx-auto mt-3 mb-3" />

      <div className="guard-scroll-panel px-5 pb-8 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-brand-primary mb-1">Pre-shift briefing</p>
            <h2 className="text-xl font-bold leading-tight">{job.title}</h2>
            <p className="text-sm text-brand-text-muted mt-1 truncate">{job.clientName}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-xs text-brand-text-muted flex items-center justify-end gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              Your pay
            </p>
            <div className="text-sm font-bold text-brand-primary mt-0.5">
              <JobBillingSummaryFromGuardJob job={job} />
            </div>
          </div>
        </div>

        <ShiftPeriodStatusBar startDate={job.startDate} endDate={job.endDate} live={false} />

        <div className="rounded-xl border border-brand-border bg-brand-bg-sec px-3 py-2.5 text-xs text-brand-text-muted leading-relaxed flex gap-2">
          <Clock className="w-4 h-4 shrink-0 mt-0.5 text-brand-primary" />
          <span>
            Shift window: {formatShiftRange(job.startDate, job.endDate)}. Review post orders and site
            briefing before you head out.
            {!enRouteOpen && enRouteCountdownMs > 0
              ? ` Start heading unlocks in ${formatCountdown(enRouteCountdownMs)}.`
              : enRouteOpen
                ? ' You can start heading to site now.'
                : null}
          </span>
        </div>

        <div className="border border-brand-border rounded-2xl p-4 space-y-4 bg-brand-bg">
          <p className="text-sm font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-primary" />
            Site briefing & post orders
          </p>

          <JobListingProfile
            job={job}
            showClientHeader={false}
            showBadges={false}
            operationalDetails={job.operationalDetails}
            operationalBriefingLocked={job.operationalBriefingLocked}
            jobStatus={job.status}
          />
        </div>

        {needsPostOrdersAck && onAckPostOrders && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 space-y-3">
            <div>
              <h3 className="font-bold text-sm">Acknowledge post orders</h3>
              <p className="text-xs text-brand-text-muted mt-1 leading-relaxed">
                Confirm you have read the client&apos;s site instructions before heading to site.
              </p>
            </div>
            <SlideToConfirm
              label="I have read the post orders"
              onConfirm={() => void onAckPostOrders()}
            />
          </div>
        )}

        <div className="space-y-3 pt-2 border-t border-brand-border">
          <p className="text-xs text-center text-brand-text-muted flex items-center justify-center gap-1.5">
            <Navigation className="w-3.5 h-3.5" />
            {enRouteOpen
              ? 'Slide when you are ready to head to the job site.'
              : 'Start heading unlocks 1 hour before your shift.'}
          </p>
          <SlideToConfirm
            label="Slide to start heading to site"
            confirmedLabel="Heading to site…"
            onConfirm={() => void onStartEnRoute()}
            disabled={slideBlocked}
            disabledHint={slideHint}
          />
        </div>
      </div>
    </div>
  );
}
