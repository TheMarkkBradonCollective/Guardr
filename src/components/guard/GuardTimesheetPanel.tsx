import React, { useMemo } from 'react';
import { Clock } from 'lucide-react';
import type { SecurityRequest } from '../../types';
import { formatShiftRange } from '../../lib/dates';
import {
  formatGuardWorkedHours,
  listGuardTimesheetEntries,
  type GuardTimesheetEntry,
} from '../../lib/guardTimesheet';
import { WfBadge, WfSectionHeader } from '../ui/wireframe';
import { AppEmptyState } from '../ui/app/AppPrimitives';

interface GuardTimesheetPanelProps {
  guardId: string;
  requests: SecurityRequest[];
}

function statusLabel(status: SecurityRequest['status']): string {
  switch (status) {
    case 'in-progress':
      return 'In progress';
    case 'completed':
      return 'Completed';
    default:
      return status;
  }
}

function TimesheetRow({ entry }: { entry: GuardTimesheetEntry }) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-4 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{entry.title}</p>
          <p className="text-xs text-brand-text-muted">{entry.clientName}</p>
        </div>
        <WfBadge tone={entry.status === 'completed' ? 'success' : 'primary'}>
          {statusLabel(entry.status)}
        </WfBadge>
      </div>
      <p className="text-xs text-brand-text-muted">
        Scheduled {formatShiftRange(entry.scheduledStart, entry.scheduledEnd)} ·{' '}
        {entry.scheduledHours}h booked
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div>
          <p className="wf-metric-label">Clock in</p>
          <p className="wf-metric-value">{new Date(entry.effectiveClockIn).toLocaleString()}</p>
        </div>
        <div>
          <p className="wf-metric-label">Clock out</p>
          <p className="wf-metric-value">
            {entry.effectiveClockOut
              ? new Date(entry.effectiveClockOut).toLocaleString()
              : 'Still on shift'}
          </p>
        </div>
        <div>
          <p className="wf-metric-label">Worked</p>
          <p className="wf-metric-value">{formatGuardWorkedHours(entry.workedHours)}</p>
        </div>
      </div>
    </div>
  );
}

export function GuardTimesheetPanel({ guardId, requests }: GuardTimesheetPanelProps) {
  const entries = useMemo(
    () => listGuardTimesheetEntries(requests, guardId),
    [requests, guardId],
  );

  if (entries.length === 0) {
    return (
      <AppEmptyState
        icon={<Clock className="w-5 h-5" />}
        title="No shift time logged yet"
      >
        Clocked-in shifts will appear here for review.
      </AppEmptyState>
    );
  }

  return (
    <section className="space-y-4">
      <WfSectionHeader title="Timesheet" className="!px-0" />
      <p className="text-sm text-brand-text-muted -mt-2">
        Recorded shift clock-in and clock-out times from completed and in-progress jobs.
      </p>
      <div className="space-y-3">
        {entries.map((entry) => (
          <TimesheetRow key={entry.requestId} entry={entry} />
        ))}
      </div>
    </section>
  );
}
