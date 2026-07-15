import React, { useState } from 'react';
import { CalendarPlus, Trash2 } from 'lucide-react';
import {
  createDateOverride,
  isInvalidAvailabilityWindow,
  loadGuardAvailabilitySchedule,
  prunePastDateOverrides,
  saveGuardAvailabilitySchedule,
  todayLocalDateKey,
  type GuardAvailabilityDateOverride,
  type GuardAvailabilitySchedule,
} from '../../lib/guardAvailability';
import { showAppToast } from '../ui/AppToast';

interface GuardAvailabilityDatesPanelProps {
  guardId: string;
  schedule?: GuardAvailabilitySchedule;
  onSave?: (schedule: GuardAvailabilitySchedule) => void | Promise<void>;
  readOnly?: boolean;
}

function formatDisplayDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export function GuardAvailabilityDatesPanel({
  guardId,
  schedule: initialSchedule,
  onSave,
  readOnly = false,
}: GuardAvailabilityDatesPanelProps) {
  const [schedule, setSchedule] = useState<GuardAvailabilitySchedule>(() => {
    const loaded = initialSchedule ?? loadGuardAvailabilitySchedule(guardId);
    return {
      ...loaded,
      dateOverrides: prunePastDateOverrides(loaded.dateOverrides),
    };
  });
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const upcoming = [...schedule.dateOverrides].sort((a, b) => a.date.localeCompare(b.date));

  const persist = async (next: GuardAvailabilitySchedule) => {
    setSaving(true);
    try {
      const saved = saveGuardAvailabilitySchedule(guardId, next);
      setSchedule(saved);
      await onSave?.(saved);
      setDirty(false);
      showAppToast('Specific dates updated', { tone: 'success' });
    } catch (err) {
      showAppToast(err instanceof Error ? err.message : 'Could not save dates.', { tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const addOverride = () => {
    if (!date) {
      showAppToast('Choose a date first', { tone: 'error' });
      return;
    }
    if (date < todayLocalDateKey()) {
      showAppToast('Past dates are not allowed', { tone: 'error' });
      return;
    }
    const candidate = createDateOverride({ guardId, date, startTime, endTime, isAvailable: true });
    if (isInvalidAvailabilityWindow(candidate)) {
      showAppToast('End time must be after start time', { tone: 'error' });
      return;
    }
    const withoutDate = schedule.dateOverrides.filter((o) => o.date !== date);
    const next = {
      ...schedule,
      dateOverrides: [...withoutDate, candidate],
    };
    setSchedule(next);
    setDirty(true);
    setDate('');
  };

  const removeOverride = (id: string) => {
    const next = {
      ...schedule,
      dateOverrides: schedule.dateOverrides.filter((o) => o.id !== id),
    };
    setSchedule(next);
    setDirty(true);
  };

  const handleSave = () => void persist(schedule);

  return (
    <section className="availability-dates-panel">
      <div className="availability-dates-header">
        <CalendarPlus className="w-5 h-5 text-brand-primary" />
        <div>
          <h3 className="text-base font-bold text-brand-text">Specific dates</h3>
          <p className="availability-calendar-subtitle">
            Add one-off availability for a single day. Past dates clear automatically.
          </p>
        </div>
      </div>

      {!readOnly && (
        <div className="availability-date-form">
          <label className="availability-date-field">
            <span>Date</span>
            <input
              type="date"
              value={date}
              min={todayLocalDateKey()}
              onChange={(e) => setDate(e.target.value)}
              className="uber-input w-full"
            />
          </label>
          <label className="availability-date-field">
            <span>From</span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="uber-input w-full"
            />
          </label>
          <label className="availability-date-field">
            <span>To</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="uber-input w-full"
            />
          </label>
          <button type="button" onClick={addOverride} className="app-button-outline app-btn-sm">
            Add date
          </button>
        </div>
      )}

      {upcoming.length === 0 ? (
        <p className="availability-off-note">No upcoming specific dates — weekly schedule applies.</p>
      ) : (
        <ul className="availability-date-list">
          {upcoming.map((override: GuardAvailabilityDateOverride) => (
            <li key={override.id} className="availability-date-item">
              <div>
                <p className="availability-date-item-title">{formatDisplayDate(override.date)}</p>
                <p className="availability-date-item-hours">
                  {override.startTime} – {override.endTime}
                  {!override.isAvailable && ' · Blocked'}
                </p>
              </div>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => removeOverride(override.id)}
                  className="availability-slot-remove"
                  aria-label={`Remove availability for ${formatDisplayDate(override.date)}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!readOnly && dirty && (
        <div className="availability-save-row">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="app-button-primary app-btn-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save specific dates'}
          </button>
        </div>
      )}
    </section>
  );
}