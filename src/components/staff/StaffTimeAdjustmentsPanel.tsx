import React, { useMemo, useState } from 'react';
import { SecurityGuard, SessionUser } from '../../types';
import { fromDatetimeLocal, formatShiftRange, toDatetimeLocal } from '../../lib/dates';
import { notifyStaffTimeEntriesChanged } from '../../lib/staffActivityTime';
import { writeAuditLog } from '../../lib/auditLog';
import {
  applyStaffTimeEntryAdjustment,
  canDeleteStaffTimeEntry,
  createManualStaffTimeEntry,
  entryHoursInPeriod,
  formatTrackedHours,
  listStaffTimeEntriesForPeriod,
  validateStaffTimeEntryRange,
  type StaffTimeEntry,
} from '../../lib/staffTimeTracking';
import {
  deleteStaffTimeEntry,
  persistStaffTimeEntries,
} from '../../lib/staffTimeTrackingStorage';
import { GuardrButton } from '../baseui/GuardrButton';

interface StaffTimeAdjustmentsPanelProps {
  currentUser: SessionUser;
  guards: SecurityGuard[];
  timeEntries: StaffTimeEntry[];
  periodStart: string;
  periodEnd: string;
  onEntriesChange: (entries: StaffTimeEntry[]) => void;
}

interface EditDraft {
  staffId: string;
  clockInLocal: string;
  clockOutLocal: string;
  note: string;
}

function emptyDraft(staffId: string): EditDraft {
  const now = new Date();
  const start = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  return {
    staffId,
    clockInLocal: toDatetimeLocal(start),
    clockOutLocal: toDatetimeLocal(now),
    note: '',
  };
}

export function StaffTimeAdjustmentsPanel({
  currentUser,
  guards,
  timeEntries,
  periodStart,
  periodEnd,
  onEntriesChange,
}: StaffTimeAdjustmentsPanelProps) {
  const staffMembers = useMemo(
    () => guards.filter((guard) => guard.isStaff).sort((a, b) => a.name.localeCompare(b.name)),
    [guards],
  );
  const [filterStaffId, setFilterStaffId] = useState<string>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<EditDraft>(() => emptyDraft(staffMembers[0]?.id ?? ''));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const periodEntries = useMemo(
    () =>
      listStaffTimeEntriesForPeriod(
        timeEntries,
        periodStart,
        periodEnd,
        filterStaffId === 'all' ? undefined : filterStaffId,
      ),
    [timeEntries, periodStart, periodEnd, filterStaffId],
  );

  const actor = { id: currentUser.id, email: currentUser.email };

  const startEdit = (entry: StaffTimeEntry) => {
    setCreating(false);
    setEditingId(entry.id);
    setDraft({
      staffId: entry.staffId,
      clockInLocal: toDatetimeLocal(entry.clockInAt),
      clockOutLocal: toDatetimeLocal(entry.clockOutAt ?? entry.lastActivityAt ?? entry.clockInAt),
      note: entry.adjustmentNote ?? '',
    });
    setError(null);
  };

  const startCreate = () => {
    setEditingId(null);
    setCreating(true);
    setDraft(emptyDraft(filterStaffId === 'all' ? staffMembers[0]?.id ?? '' : filterStaffId));
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setCreating(false);
    setError(null);
  };

  const saveDraft = async () => {
    const staff = staffMembers.find((member) => member.id === draft.staffId);
    if (!staff) {
      setError('Select a staff member.');
      return;
    }

    const clockInAt = fromDatetimeLocal(draft.clockInLocal);
    const clockOutAt = fromDatetimeLocal(draft.clockOutLocal);
    const validationError = validateStaffTimeEntryRange(clockInAt, clockOutAt);
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      let next: StaffTimeEntry[];
      if (creating) {
        const created = createManualStaffTimeEntry({
          staffId: staff.id,
          staffName: staff.name,
          clockInAt,
          clockOutAt,
          adjustmentNote: draft.note,
          actor,
        });
        next = await persistStaffTimeEntries([created, ...timeEntries]);
        await writeAuditLog(currentUser, 'staff_time_entry_created', 'staff_time_entry', created.id, {
          staffId: staff.id,
          staffName: staff.name,
          clockInAt,
          clockOutAt,
          adjustmentNote: draft.note || undefined,
        });
      } else if (editingId) {
        const existing = timeEntries.find((entry) => entry.id === editingId);
        if (!existing) return;
        const updated = applyStaffTimeEntryAdjustment(
          existing,
          { clockInAt, clockOutAt, adjustmentNote: draft.note },
          actor,
        );
        next = await persistStaffTimeEntries(
          timeEntries.map((entry) => (entry.id === updated.id ? updated : entry)),
        );
        await writeAuditLog(currentUser, 'staff_time_entry_adjusted', 'staff_time_entry', updated.id, {
          staffId: updated.staffId,
          staffName: updated.staffName,
          clockInAt,
          clockOutAt,
          adjustmentNote: draft.note || undefined,
          source: updated.source ?? 'automatic',
        });
      } else {
        return;
      }

      onEntriesChange(next);
      notifyStaffTimeEntriesChanged();
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save time entry.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (entry: StaffTimeEntry) => {
    if (!canDeleteStaffTimeEntry(entry)) return;
    setBusy(true);
    setError(null);
    try {
      const next = await deleteStaffTimeEntry(entry.id);
      onEntriesChange(next);
      notifyStaffTimeEntriesChanged();
      await writeAuditLog(currentUser, 'staff_time_entry_deleted', 'staff_time_entry', entry.id, {
        staffId: entry.staffId,
        staffName: entry.staffName,
      });
      if (editingId === entry.id) cancelEdit();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-brand-border p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-brand-text">Adjust tracked time</p>
          <p className="text-xs text-brand-text/60">
            Managers and above can correct automatic sessions or add manual time for this pay period.
          </p>
        </div>
        <GuardrButton kind="secondary" size="compact" disabled={busy || creating} onClick={startCreate}>
          Add time entry
        </GuardrButton>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs text-brand-text/70">
          Staff
          <select
            className="uber-input ml-2"
            value={filterStaffId}
            onChange={(e) => setFilterStaffId(e.target.value)}
          >
            <option value="all">All staff</option>
            {staffMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {(creating || editingId) && (
        <div className="rounded-lg border border-brand-border/80 bg-brand-surface/40 p-4 space-y-3">
          <p className="text-sm font-medium text-brand-text">
            {creating ? 'Add manual time entry' : 'Edit time entry'}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-brand-text/70">
              Staff member
              <select
                className="uber-input w-full mt-1"
                value={draft.staffId}
                disabled={!creating || busy}
                onChange={(e) => setDraft((prev) => ({ ...prev, staffId: e.target.value }))}
              >
                {staffMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-brand-text/70">
              Note (optional)
              <input
                className="uber-input w-full mt-1"
                value={draft.note}
                disabled={busy}
                placeholder="Reason for adjustment"
                onChange={(e) => setDraft((prev) => ({ ...prev, note: e.target.value }))}
              />
            </label>
            <label className="text-xs text-brand-text/70">
              Start
              <input
                type="datetime-local"
                className="uber-input w-full mt-1"
                value={draft.clockInLocal}
                disabled={busy}
                onChange={(e) => setDraft((prev) => ({ ...prev, clockInLocal: e.target.value }))}
              />
            </label>
            <label className="text-xs text-brand-text/70">
              End
              <input
                type="datetime-local"
                className="uber-input w-full mt-1"
                min={draft.clockInLocal}
                value={draft.clockOutLocal}
                disabled={busy}
                onChange={(e) => setDraft((prev) => ({ ...prev, clockOutLocal: e.target.value }))}
              />
            </label>
          </div>
          {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <GuardrButton kind="primary" size="compact" disabled={busy} onClick={() => void saveDraft()}>
              {busy ? 'Saving…' : 'Save'}
            </GuardrButton>
            <GuardrButton kind="secondary" size="compact" disabled={busy} onClick={cancelEdit}>
              Cancel
            </GuardrButton>
          </div>
        </div>
      )}

      <div className="adm-table-wrap rounded-lg border border-brand-border overflow-x-auto">
        <table className="adm-table w-full text-sm min-w-[44rem]">
          <thead>
            <tr>
              <th>Staff</th>
              <th>Session</th>
              <th>Hours</th>
              <th>Source</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {periodEntries.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-brand-text/60">
                  No tracked time in this period.
                </td>
              </tr>
            ) : (
              periodEntries.map((entry) => {
                const hours = entryHoursInPeriod(entry, periodStart, periodEnd);
                const isAdjusted = Boolean(entry.adjustedAt || entry.source === 'manual');
                return (
                  <tr key={entry.id}>
                    <td>
                      <div className="font-medium text-brand-text">{entry.staffName}</div>
                      {entry.adjustmentNote ? (
                        <div className="text-xs text-brand-text/60">{entry.adjustmentNote}</div>
                      ) : null}
                    </td>
                    <td className="text-xs text-brand-text/80">
                      {formatShiftRange(entry.clockInAt, entry.clockOutAt ?? entry.lastActivityAt ?? entry.clockInAt)}
                    </td>
                    <td>{formatTrackedHours(hours)}</td>
                    <td className="text-xs text-brand-text/70">
                      {entry.source === 'manual' ? 'Manual' : isAdjusted ? 'Adjusted' : 'Automatic'}
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-2 justify-end">
                        <GuardrButton
                          kind="secondary"
                          size="compact"
                          disabled={busy}
                          onClick={() => startEdit(entry)}
                        >
                          Edit
                        </GuardrButton>
                        {canDeleteStaffTimeEntry(entry) ? (
                          <GuardrButton
                            kind="secondary"
                            size="compact"
                            disabled={busy}
                            onClick={() => void handleDelete(entry)}
                          >
                            Delete
                          </GuardrButton>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
