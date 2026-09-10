import React, { useEffect, useMemo, useState } from 'react';
import { Clock } from 'lucide-react';
import {
  formatCompensationPeriodLabel,
  getCompensationPeriodBounds,
} from '../../lib/staffCompensation';
import { STAFF_TIME_ENTRIES_CHANGED_EVENT } from '../../lib/staffActivityTime';
import { formatShiftRange } from '../../lib/dates';
import type { PlatformSettings } from '../../lib/platformSettings';
import {
  elapsedActiveSessionSeconds,
  entryHoursInPeriod,
  formatElapsedDuration,
  formatTrackedHours,
  getActiveStaffTimeEntry,
  isStaffTimeEntryActive,
  listStaffTimeEntriesForPeriod,
  sumStaffHoursInPeriod,
  type StaffTimeEntry,
} from '../../lib/staffTimeTracking';
import { loadStaffTimeEntries } from '../../lib/staffTimeTrackingStorage';
import { AppEmptyState, AppRequestState } from '../ui/app/AppPrimitives';
import { userFacingError } from '../../lib/userFacingError';
import { WfBadge, WfSectionHeader } from '../ui/wireframe';

interface StaffTimesheetsPanelProps {
  staffId: string;
  platformSettings: PlatformSettings;
  /** When true, note that managers can adjust time in Staff compensation. */
  showManagerHint?: boolean;
}

function sourceLabel(entry: StaffTimeEntry): string {
  if (entry.source === 'manual') return 'Manual';
  if (entry.adjustedAt) return 'Adjusted';
  return 'Automatic';
}

function TimesheetRow({ entry, periodStart, periodEnd }: {
  entry: StaffTimeEntry;
  periodStart: string;
  periodEnd: string;
}) {
  const hours = entryHoursInPeriod(entry, periodStart, periodEnd);
  const active = isStaffTimeEntryActive(entry);
  const sessionEnd = entry.clockOutAt ?? entry.lastActivityAt ?? entry.clockInAt;

  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-4 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm">
            {formatShiftRange(entry.clockInAt, sessionEnd)}
          </p>
          <p className="text-xs text-brand-text-muted">
            {new Date(entry.clockInAt).toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {entry.adjustedAt || entry.source === 'manual' ? (
            <WfBadge tone="warning">{sourceLabel(entry)}</WfBadge>
          ) : (
            <WfBadge tone="primary">{sourceLabel(entry)}</WfBadge>
          )}
          {active ? <WfBadge tone="success">Active</WfBadge> : null}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
        <div>
          <p className="wf-metric-label">Started</p>
          <p className="wf-metric-value">{new Date(entry.clockInAt).toLocaleString()}</p>
        </div>
        <div>
          <p className="wf-metric-label">Ended</p>
          <p className="wf-metric-value">
            {active
              ? `Active · ${formatElapsedDuration(elapsedActiveSessionSeconds(entry))}`
              : new Date(sessionEnd).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="wf-metric-label">Hours (period)</p>
          <p className="wf-metric-value">{formatTrackedHours(hours)}</p>
        </div>
      </div>
      {entry.adjustmentNote ? (
        <p className="text-xs text-brand-text-muted">Note: {entry.adjustmentNote}</p>
      ) : null}
      {entry.adjustedByEmail ? (
        <p className="text-xs text-brand-text-muted">
          Adjusted by {entry.adjustedByEmail}
          {entry.adjustedAt ? ` · ${new Date(entry.adjustedAt).toLocaleString()}` : ''}
        </p>
      ) : null}
    </div>
  );
}

export function StaffTimesheetsPanel({
  staffId,
  platformSettings,
  showManagerHint = false,
}: StaffTimesheetsPanelProps) {
  const config = platformSettings.staffCompensation!;
  const { periodStart, periodEnd } = useMemo(
    () => getCompensationPeriodBounds(config.cadence),
    [config.cadence],
  );
  const periodLabel = formatCompensationPeriodLabel(periodStart, periodEnd, config.cadence);

  const [timeEntries, setTimeEntries] = useState<StaffTimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const reload = () => {
      setError(null);
      void loadStaffTimeEntries()
        .then((rows) => {
          if (active) {
            setTimeEntries(rows);
            setLoading(false);
          }
        })
        .catch((err) => {
          if (active) {
            setError(userFacingError(err, 'Could not load timesheet.'));
            setLoading(false);
          }
        });
    };
    reload();
    window.addEventListener(STAFF_TIME_ENTRIES_CHANGED_EVENT, reload);
    return () => {
      active = false;
      window.removeEventListener(STAFF_TIME_ENTRIES_CHANGED_EVENT, reload);
    };
  }, []);

  const periodEntries = useMemo(
    () => listStaffTimeEntriesForPeriod(timeEntries, periodStart, periodEnd, staffId),
    [timeEntries, periodStart, periodEnd, staffId],
  );
  const totalHours = useMemo(
    () => sumStaffHoursInPeriod(timeEntries, staffId, periodStart, periodEnd),
    [timeEntries, staffId, periodStart, periodEnd],
  );
  const activeEntry = getActiveStaffTimeEntry(timeEntries, staffId);

  if (loading || error) {
    return (
      <AppRequestState
        status={loading ? 'loading' : 'error'}
        title={loading ? 'Loading' : 'Could not load timesheet'}
        message={error ?? 'This should only take a moment.'}
        onRetry={
          error
            ? () => {
                setLoading(true);
                setError(null);
                void loadStaffTimeEntries()
                  .then((rows) => {
                    setTimeEntries(rows);
                    setLoading(false);
                  })
                  .catch((err) => {
                    setError(userFacingError(err, 'Could not load timesheet.'));
                    setLoading(false);
                  });
              }
            : undefined
        }
      />
    );
  }

  return (
    <section className="space-y-4">
      <WfSectionHeader title="Timesheets" className="!px-0" />
      <p className="text-sm text-brand-text-muted -mt-2">
        {showManagerHint
          ? 'Tracked active time for this pay period. Managers can adjust sessions in Staff compensation → Time adjustments.'
          : 'Your automatically tracked active time for this pay period.'}
      </p>

      <div className="rounded-xl border border-brand-border bg-brand-surface/50 p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <p className="wf-metric-label">Pay period</p>
          <p className="wf-metric-value text-base">{periodLabel}</p>
        </div>
        <div>
          <p className="wf-metric-label">Total hours</p>
          <p className="wf-metric-value text-base">{formatTrackedHours(totalHours)}</p>
        </div>
        <div>
          <p className="wf-metric-label">Sessions</p>
          <p className="wf-metric-value text-base">{periodEntries.length}</p>
        </div>
      </div>

      {activeEntry ? (
        <p className="text-sm text-brand-primary">
          Active session · {formatElapsedDuration(elapsedActiveSessionSeconds(activeEntry))} tracked
        </p>
      ) : null}

      {periodEntries.length === 0 ? (
        <AppEmptyState icon={<Clock className="w-5 h-5" />} title="No tracked time this period">
          Active work on the site is tracked automatically and will appear here.
        </AppEmptyState>
      ) : (
        <div className="space-y-3">
          {periodEntries.map((entry) => (
            <TimesheetRow
              key={entry.id}
              entry={entry}
              periodStart={periodStart}
              periodEnd={periodEnd}
            />
          ))}
        </div>
      )}
    </section>
  );
}
