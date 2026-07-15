import React, { useMemo, useState } from 'react';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import {
  dayLabel,
  dayLabelFull,
  defaultAvailabilitySchedule,
  getEnabledWeekDays,
  isInvalidAvailabilityWindow,
  isWeekDayEnabled,
  loadGuardAvailabilitySchedule,
  saveGuardAvailabilitySchedule,
  slotsForWeekDay,
  toggleWeekDay,
  WEEK_DAY_ORDER,
  type GuardAvailabilitySchedule,
  type GuardAvailabilitySlot,
} from '../../lib/guardAvailability';
import { showAppToast } from '../ui/AppToast';

interface GuardAvailabilityCalendarProps {
  guardId: string;
  schedule?: GuardAvailabilitySchedule;
  onSave?: (schedule: GuardAvailabilitySchedule) => void | Promise<void>;
  readOnly?: boolean;
}

function defaultFocusedDay(slots: GuardAvailabilitySlot[]): number {
  const enabled = getEnabledWeekDays(slots);
  if (enabled.length) return enabled[0];
  const today = new Date().getDay();
  return WEEK_DAY_ORDER.includes(today as (typeof WEEK_DAY_ORDER)[number]) ? today : 1;
}

export function GuardAvailabilityCalendar({
  guardId,
  schedule: initialSchedule,
  onSave,
  readOnly = false,
}: GuardAvailabilityCalendarProps) {
  const [schedule, setSchedule] = useState<GuardAvailabilitySchedule>(
    initialSchedule ?? loadGuardAvailabilitySchedule(guardId) ?? defaultAvailabilitySchedule(guardId)
  );
  const [focusedDay, setFocusedDay] = useState<number>(() =>
    defaultFocusedDay(initialSchedule?.weeklySlots ?? schedule.weeklySlots)
  );
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const enabledDays = useMemo(() => getEnabledWeekDays(schedule.weeklySlots), [schedule.weeklySlots]);
  const daySlots = slotsForWeekDay(schedule.weeklySlots, focusedDay);
  const focusedDayEnabled = isWeekDayEnabled(schedule.weeklySlots, focusedDay);

  const updateSchedule = (next: GuardAvailabilitySchedule) => {
    setSchedule(next);
    setDirty(true);
  };

  const updateSlot = (id: string, patch: Partial<GuardAvailabilitySlot>) => {
    updateSchedule({
      ...schedule,
      weeklySlots: schedule.weeklySlots.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)),
    });
  };

  const handleToggleDay = (day: number) => {
    const enabled = isWeekDayEnabled(schedule.weeklySlots, day);
    const nextSlots = toggleWeekDay(schedule.weeklySlots, guardId, day, !enabled);
    updateSchedule({ ...schedule, weeklySlots: nextSlots });
    if (!enabled) setFocusedDay(day);
    else if (focusedDay === day) {
      const nextEnabled = getEnabledWeekDays(nextSlots);
      if (nextEnabled.length) setFocusedDay(nextEnabled[0]);
    }
  };

  const handleSave = async () => {
    const invalid = schedule.weeklySlots.find(isInvalidAvailabilityWindow);
    if (invalid) {
      showAppToast('Fix the highlighted time range before saving', {
        body: `${dayLabel(invalid.dayOfWeek)}: end time must be after start time.`,
        tone: 'error',
      });
      return;
    }
    setSaving(true);
    try {
      const saved = saveGuardAvailabilitySchedule(guardId, schedule);
      setSchedule(saved);
      await onSave?.(saved);
      setDirty(false);
      showAppToast('Availability saved', { tone: 'success' });
    } catch (err) {
      showAppToast(err instanceof Error ? err.message : 'Could not save availability.', { tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const addSlot = () => {
    updateSchedule({
      ...schedule,
      weeklySlots: [
        ...schedule.weeklySlots,
        {
          id: `avail-${guardId}-${Date.now()}`,
          guardId,
          dayOfWeek: focusedDay,
          startTime: '09:00',
          endTime: '17:00',
          isAvailable: true,
        },
      ],
    });
  };

  const removeSlot = (id: string) => {
    const remaining = schedule.weeklySlots.filter((slot) => slot.id !== id);
    const stillEnabled = remaining.some((slot) => slot.dayOfWeek === focusedDay && slot.isAvailable);
    updateSchedule({
      ...schedule,
      weeklySlots: stillEnabled ? remaining : toggleWeekDay(remaining, guardId, focusedDay, false),
    });
  };

  return (
    <div className="availability-calendar">
      <div className="availability-calendar-header">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-primary" />
          <h3 className="text-base font-bold text-brand-text">Weekly schedule</h3>
        </div>
        <p className="availability-calendar-subtitle">
          Toggle days you work. You only see jobs and alerts on enabled days within these hours.
        </p>
      </div>

      <div className="availability-day-row" role="group" aria-label="Days of the week">
        {WEEK_DAY_ORDER.map((day) => {
          const enabled = enabledDays.includes(day);
          const focused = focusedDay === day;
          return (
            <button
              key={day}
              type="button"
              disabled={readOnly}
              onClick={() => {
                if (!enabled) handleToggleDay(day);
                else setFocusedDay(day);
              }}
              className={`availability-day-circle ${enabled ? 'availability-day-circle-on' : ''} ${
                focused && enabled ? 'availability-day-circle-focus' : ''
              }`}
              aria-pressed={enabled}
              aria-label={`${dayLabelFull(day)}${enabled ? ', available' : ', unavailable'}`}
              title={
                readOnly
                  ? dayLabel(day)
                  : enabled
                    ? `${dayLabel(day)} — click to edit hours`
                    : `${dayLabel(day)} — click to enable`
              }
            >
              <span>{dayLabel(day).slice(0, 1)}</span>
            </button>
          );
        })}
      </div>

      {!readOnly && (
        <div className="availability-day-actions">
          {focusedDayEnabled ? (
            <button
              type="button"
              onClick={() => handleToggleDay(focusedDay)}
              className="availability-day-off-btn"
            >
              Turn off {dayLabelFull(focusedDay)}
            </button>
          ) : (
            <p className="text-sm text-brand-text-muted">
              Select a highlighted day to set hours, or tap a gray day to enable it.
            </p>
          )}
        </div>
      )}

      {focusedDayEnabled ? (
        <div className="availability-time-panel">
          <p className="availability-time-panel-title">{dayLabelFull(focusedDay)} hours</p>
          <div className="space-y-2">
            {daySlots.map((slot) => {
              const invalidWindow = isInvalidAvailabilityWindow(slot);
              return (
                <div
                  key={slot.id}
                  className={`availability-slot-row ${invalidWindow ? 'availability-slot-row-invalid' : ''}`}
                >
                  <input
                    type="time"
                    value={slot.startTime}
                    disabled={readOnly}
                    onChange={(e) => updateSlot(slot.id, { startTime: e.target.value })}
                    aria-invalid={invalidWindow}
                    className="uber-input text-sm w-28"
                  />
                  <span className="text-brand-text-muted text-sm">to</span>
                  <input
                    type="time"
                    value={slot.endTime}
                    disabled={readOnly}
                    onChange={(e) => updateSlot(slot.id, { endTime: e.target.value })}
                    aria-invalid={invalidWindow}
                    className="uber-input text-sm w-28"
                  />
                  {!readOnly && daySlots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSlot(slot.id)}
                      className="availability-slot-remove"
                      aria-label={`Remove ${dayLabel(focusedDay)} availability slot`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  {invalidWindow && (
                    <p className="availability-slot-error">End time must be after start time.</p>
                  )}
                </div>
              );
            })}
          </div>
          {!readOnly && (
            <button type="button" onClick={addSlot} className="availability-add-slot">
              <Plus className="w-4 h-4" />
              Add another window
            </button>
          )}
        </div>
      ) : (
        <p className="availability-off-note">
          {enabledDays.length === 0
            ? 'No days selected — you will not receive open jobs or shift alerts until you enable at least one day.'
            : `${dayLabelFull(focusedDay)} is off. Enable it above to set hours.`}
        </p>
      )}

      {!readOnly && (
        <div className="availability-save-row">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !dirty}
            className="app-button-primary app-btn-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : dirty ? 'Save availability' : 'Saved'}
          </button>
        </div>
      )}
    </div>
  );
}
