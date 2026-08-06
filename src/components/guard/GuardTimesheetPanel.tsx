import React, { useMemo, useState } from 'react';
import { Clock, Pencil } from 'lucide-react';
import type { SecurityRequest } from '../../types';
import { formatShiftRange, fromDatetimeLocal, toDatetimeLocal } from '../../lib/dates';
import {
  formatGuardWorkedHours,
  getEffectiveClockIn,
  getEffectiveClockOut,
  listGuardTimesheetEntries,
  type GuardTimesheetEntry,
} from '../../lib/guardTimesheet';
import { WfBadge, WfSectionHeader } from '../ui/wireframe';
import { AppButton } from '../ui/AppButton';
import { AppEmptyState } from '../ui/app/AppPrimitives';

interface GuardTimesheetPanelProps {
  guardId: string;
  requests: SecurityRequest[];
  canAdjust?: boolean;
  onAdjustShiftTime?: (
    requestId: string,
    payload: { clockInAt: string; clockOutAt: string; note?: string },
  ) => void | Promise<void>;
}

interface EditDraft {
  clockInLocal: string;
  clockOutLocal: string;
  note: string;
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

function TimesheetRow({
  entry,
  canAdjust,
  onEdit,
}: {
  entry: GuardTimesheetEntry;
  canAdjust: boolean;
  onEdit: () => void;
}) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-surface p-4 space-y-2">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{entry.title}</p>
          <p className="text-xs text-brand-text-muted">{entry.clientName}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {entry.adjusted ? <WfBadge tone="warning">Adjusted</WfBadge> : null}
          <WfBadge tone={entry.status === 'completed' ? 'success' : 'primary'}>
            {statusLabel(entry.status)}
          </WfBadge>
        </div>
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
      {entry.adjusted && entry.recordedClockIn && entry.recordedClockOut ? (
        <p className="text-xs text-brand-text-muted">
          Recorded {new Date(entry.recordedClockIn).toLocaleTimeString()} –{' '}
          {new Date(entry.recordedClockOut).toLocaleTimeString()}
        </p>
      ) : null}
      {entry.adjustmentNote ? (
        <p className="text-xs text-brand-text-muted">Note: {entry.adjustmentNote}</p>
      ) : null}
      {canAdjust && entry.effectiveClockOut ? (
        <div className="pt-1">
          <AppButton variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="w-3.5 h-3.5" />
            Adjust time
          </AppButton>
        </div>
      ) : null}
    </div>
  );
}

export function GuardTimesheetPanel({
  guardId,
  requests,
  canAdjust = false,
  onAdjustShiftTime,
}: GuardTimesheetPanelProps) {
  const entries = useMemo(
    () => listGuardTimesheetEntries(requests, guardId),
    [requests, guardId],
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft>({ clockInLocal: '', clockOutLocal: '', note: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editingEntry = entries.find((entry) => entry.requestId === editingId);
  const editingRequest = editingId ? requests.find((req) => req.id === editingId) : undefined;

  const startEdit = (entry: GuardTimesheetEntry) => {
    const req = requests.find((item) => item.id === entry.requestId);
    if (!req) return;
    const clockIn = getEffectiveClockIn(req);
    const clockOut = getEffectiveClockOut(req);
    if (!clockOut) return;
    setEditingId(entry.requestId);
    setDraft({
      clockInLocal: toDatetimeLocal(clockIn),
      clockOutLocal: toDatetimeLocal(clockOut),
      note: req.shiftTimeAdjustment?.note ?? '',
    });
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setError(null);
  };

  const saveEdit = async () => {
    if (!editingId || !onAdjustShiftTime) return;
    setBusy(true);
    setError(null);
    try {
      await onAdjustShiftTime(editingId, {
        clockInAt: fromDatetimeLocal(draft.clockInLocal),
        clockOutAt: fromDatetimeLocal(draft.clockOutLocal),
        note: draft.note,
      });
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save time adjustment.');
    } finally {
      setBusy(false);
    }
  };

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
        {canAdjust
          ? 'Review shift clock times and adjust when needed for billing.'
          : 'Your recorded shift clock-in and clock-out times.'}
      </p>

      {editingEntry && editingRequest ? (
        <div className="rounded-xl border border-brand-primary/30 bg-brand-surface p-4 space-y-3">
          <p className="font-semibold text-sm">Adjust {editingEntry.title}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1 text-sm">
              <span className="text-brand-text-muted">Clock in</span>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2"
                value={draft.clockInLocal}
                onChange={(event) => setDraft((prev) => ({ ...prev, clockInLocal: event.target.value }))}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-brand-text-muted">Clock out</span>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2"
                value={draft.clockOutLocal}
                onChange={(event) => setDraft((prev) => ({ ...prev, clockOutLocal: event.target.value }))}
              />
            </label>
          </div>
          <label className="block space-y-1 text-sm">
            <span className="text-brand-text-muted">Adjustment note</span>
            <textarea
              className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 min-h-[72px]"
              value={draft.note}
              onChange={(event) => setDraft((prev) => ({ ...prev, note: event.target.value }))}
              placeholder="Why this time was changed"
            />
          </label>
          {error ? <p className="text-xs text-red-500">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <AppButton size="sm" onClick={saveEdit} disabled={busy}>
              Save adjustment
            </AppButton>
            <AppButton size="sm" variant="outline" onClick={cancelEdit} disabled={busy}>
              Cancel
            </AppButton>
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        {entries.map((entry) => (
          <TimesheetRow
            key={entry.requestId}
            entry={entry}
            canAdjust={canAdjust && Boolean(onAdjustShiftTime)}
            onEdit={() => startEdit(entry)}
          />
        ))}
      </div>
    </section>
  );
}
