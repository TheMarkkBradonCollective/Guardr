import React, { useState } from 'react';
import { CalendarOff, Trash2 } from 'lucide-react';
import {
  createOffDayOverride,
  isOffDayOverride,
  loadGuardAvailabilitySchedule,
  prunePastDateOverrides,
  saveGuardAvailabilitySchedule,
  todayLocalDateKey,
  type GuardAvailabilityDateOverride,
  type GuardAvailabilitySchedule,
} from '../../lib/guardAvailability';
import { showAppToast } from '../ui/AppToast';
import { userFacingError } from '../../lib/userFacingError';

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
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const upcoming = [...schedule.dateOverrides]
    .filter(isOffDayOverride)
    .sort((a, b) => a.date.localeCompare(b.date));

  const persist = async (next: GuardAvailabilitySchedule) => {
    setSaving(true);
    try {
      const saved = saveGuardAvailabilitySchedule(guardId, next);
      setSchedule(saved);
      await onSave?.(saved);
      setDirty(false);
      showAppToast('Off days updated', { tone: 'success' });
    } catch (err) {
      showAppToast(userFacingError(err, 'Could not save off days.'), { tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const addOffDay = () => {
    if (!date) {
      showAppToast('Choose a date first', { tone: 'error' });
      return;
    }
    if (date < todayLocalDateKey()) {
      showAppToast('Past dates are not allowed', { tone: 'error' });
      return;
    }
    if (schedule.dateOverrides.some((o) => o.date === date && isOffDayOverride(o))) {
      showAppToast('That date is already marked off', { tone: 'error' });
      return;
    }
    const candidate = createOffDayOverride({ guardId, date });
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
      <div className="guard-factors-header availability-dates-header">
        <div className="availability-dates-title-row">
          <CalendarOff className="w-5 h-5 text-brand-primary shrink-0" aria-hidden />
          <div>
            <h3 className="guard-factors-heading">Specific dates</h3>
            <p className="guard-factors-subheading">
              Mark one-off days you are unavailable. Past dates clear automatically.
            </p>
          </div>
        </div>
      </div>

      {!readOnly && (
        <div className="availability-date-form">
          <label className="availability-date-field">
            <span>Date to mark off</span>
            <input
              type="date"
              value={date}
              min={todayLocalDateKey()}
              onChange={(e) => setDate(e.target.value)}
              className="uber-input w-full"
            />
          </label>
          <button type="button" onClick={addOffDay} className="app-button-outline app-btn-sm">
            Mark day off
          </button>
        </div>
      )}

      {upcoming.length === 0 ? (
        <p className="availability-off-note availability-dates-empty">
          No upcoming off days — your weekly schedule applies.
        </p>
      ) : (
        <ul className="availability-date-list">
          {upcoming.map((override: GuardAvailabilityDateOverride) => (
            <li key={override.id}>
              <article className="guard-factor-card availability-off-day-card guard-factor-card-low">
                <div className="availability-day-card-head">
                  <p className="guard-factor-card-label">{formatDisplayDate(override.date)}</p>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => removeOverride(override.id)}
                      className="availability-slot-remove"
                      aria-label={`Remove off day for ${formatDisplayDate(override.date)}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="guard-factor-card-rate availability-off-day-value">Off</p>
                <div className="guard-factor-card-footer availability-day-card-footer">
                  <span className="guard-factor-card-points">Overrides your weekly hours for this date</span>
                  <span className="guard-factor-card-status guard-factor-status-low">
                    <span className="guard-factor-status-dot" />
                    Day off
                  </span>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      {!readOnly && dirty && (
        <div className="availability-save-row availability-dates-save-row">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="app-button-primary app-btn-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save off days'}
          </button>
        </div>
      )}
    </section>
  );
}
