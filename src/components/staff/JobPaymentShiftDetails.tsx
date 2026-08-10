import React from 'react';
import type { SecurityRequest } from '../../types';
import { formatShiftRange } from '../../lib/dates';
import {
  computeWorkedHours,
  formatGuardWorkedHours,
  getEffectiveClockIn,
  getEffectiveClockOut,
  getRecordedClockIn,
  getRecordedClockOut,
  guardHasTimesheetActivity,
} from '../../lib/guardTimesheet';
import { WfBadge } from '../ui/wireframe';

interface JobPaymentShiftDetailsProps {
  req: SecurityRequest;
}

function formatTimestamp(value?: string): string {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export function JobPaymentShiftDetails({ req }: JobPaymentShiftDetailsProps) {
  const guardId = req.assignedGuardId;
  if (!guardId || !guardHasTimesheetActivity(req, guardId)) {
    return (
      <div className="rounded-lg border border-brand-border bg-brand-surface/50 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted mb-2">
          Shift schedule
        </p>
        <p className="text-sm">{formatShiftRange(req.startDate, req.endDate)}</p>
        <p className="text-xs text-brand-text-muted mt-1">{req.durationHours}h scheduled · No clock activity yet</p>
      </div>
    );
  }

  const effectiveClockIn = getEffectiveClockIn(req);
  const effectiveClockOut = getEffectiveClockOut(req);
  const workedHours = computeWorkedHours(effectiveClockIn, effectiveClockOut);
  const recordedClockIn = getRecordedClockIn(req);
  const recordedClockOut = getRecordedClockOut(req);
  const adjusted = Boolean(
    req.shiftTimeAdjustment?.clockInAt || req.shiftTimeAdjustment?.clockOutAt,
  );

  return (
    <div className="rounded-lg border border-brand-border bg-brand-surface/50 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted">
          Shift hours &amp; dates
        </p>
        {adjusted ? <WfBadge tone="warning">Time adjusted</WfBadge> : null}
      </div>
      <p className="text-sm font-medium">{formatShiftRange(req.startDate, req.endDate)}</p>
      <p className="text-xs text-brand-text-muted">{req.durationHours}h scheduled</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted">Clock in</p>
          <p className="font-medium mt-0.5">{formatTimestamp(effectiveClockIn)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted">Clock out</p>
          <p className="font-medium mt-0.5">
            {effectiveClockOut ? formatTimestamp(effectiveClockOut) : 'Still on shift'}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted">Total worked</p>
          <p className="font-semibold mt-0.5 text-brand-primary">{formatGuardWorkedHours(workedHours)}</p>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-text-muted">Payout released</p>
          <p className="font-medium mt-0.5">
            {req.guardPayoutAvailableAt
              ? formatTimestamp(req.guardPayoutAvailableAt)
              : 'Not released yet'}
          </p>
        </div>
      </div>
      {adjusted && recordedClockIn && recordedClockOut ? (
        <p className="text-xs text-brand-text-muted">
          Recorded {new Date(recordedClockIn).toLocaleTimeString()} –{' '}
          {new Date(recordedClockOut).toLocaleTimeString()}
        </p>
      ) : null}
      {req.shiftTimeAdjustment?.note ? (
        <p className="text-xs text-brand-text-muted">Adjustment note: {req.shiftTimeAdjustment.note}</p>
      ) : null}
    </div>
  );
}
