import React, { useMemo, useState } from 'react';
import { Calendar, Plus, Trash2, TrendingUp } from 'lucide-react';
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
import { GuardAvailabilityDatesPanel } from './GuardAvailabilityDatesPanel';

interface GuardAvailabilityCalendarProps {
  guardId: string;
  schedule?: GuardAvailabilitySchedule;
  onSave?: (schedule: GuardAvailabilitySchedule) => void | Promise<void>;
  readOnly?: boolean;
}

function availabilityHeroClass(enabledCount: number): string {
  if (enabledCount >= 5) return 'guard-tier-hero-professional';
  if (enabledCount >= 1) return 'guard-tier-hero-rising';
  return 'guard-tier-hero-starting';
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
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const enabledDays = useMemo(
    () => getEnabledWeekDays(schedule.weeklySlots).sort((a, b) => {
      const orderA = WEEK_DAY_ORDER.indexOf(a as (typeof WEEK_DAY_ORDER)[number]);
      const orderB = WEEK_DAY_ORDER.indexOf(b as (typeof WEEK_DAY_ORDER)[number]);
      return orderA - orderB;
    }),
    [schedule.weeklySlots]
  );

  const enabledPercent = Math.round((enabledDays.length / WEEK_DAY_ORDER.length) * 100);

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

  const addSlot = (day: number) => {
    updateSchedule({
      ...schedule,
      weeklySlots: [
        ...schedule.weeklySlots,
        {
          id: `avail-${guardId}-${Date.now()}`,
          guardId,
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          isAvailable: true,
        },
      ],
    });
  };

  const removeSlot = (day: number, id: string) => {
    const remaining = schedule.weeklySlots.filter((slot) => slot.id !== id);
    const stillEnabled = remaining.some((slot) => slot.dayOfWeek === day && slot.isAvailable);
    updateSchedule({
      ...schedule,
      weeklySlots: stillEnabled ? remaining : toggleWeekDay(remaining, guardId, day, false),
    });
  };

  return (
    <>
      <div className="guard-tiered-screen-pinned">
        <section className="guard-rating-section guard-rating-section-tiered guard-tier-hero-card">
          <div className={`guard-tier-hero guard-availability-tier-hero ${availabilityHeroClass(enabledDays.length)}`}>
            <div className="guard-tier-hero-glow" aria-hidden />
            <div className="guard-pref-tier-medal" aria-hidden>
              <div className="guard-pref-tier-medal-ring">
                <Calendar className="guard-pref-tier-medal-icon" />
              </div>
            </div>
            <p className="guard-tier-hero-eyebrow">Weekly schedule</p>
            <h2 className="guard-tier-hero-name">Your availability</h2>
            <div className="guard-tier-hero-score-row">
              <span className="guard-tier-hero-score-label">Active days</span>
              <span className="guard-tier-hero-score-value">
                {enabledDays.length}
                <span className="guard-pref-hero-score-total"> / {WEEK_DAY_ORDER.length}</span>
              </span>
            </div>
            <div className="guard-pref-onboard-progress">
              <div className="guard-tier-progress-track" role="presentation">
                <div className="guard-tier-progress-fill" style={{ width: `${enabledPercent}%` }} />
              </div>
              <p className="guard-pref-onboard-progress-hint">
                <TrendingUp className="guard-tier-progress-hint-icon" aria-hidden />
                <span>
                  {enabledDays.length > 0
                    ? `${enabledDays.map((day) => dayLabel(day)).join(', ')} selected`
                    : 'Select at least one day to receive jobs and alerts'}
                </span>
              </p>
            </div>
            <p className="guard-tier-hero-subtitle">
              Jobs and alerts only appear when a shift fits your enabled days and hours.
            </p>
          </div>
        </section>
      </div>

      <div className="guard-tiered-screen-scroll">
        <div className="guard-pref-body availability-body">
        <section className="guard-factors-section availability-days-section">
          <div className="guard-factors-header">
            <h3 className="guard-factors-heading">Select your days</h3>
            <p className="guard-factors-subheading">
              Tap to multi-select. A card appears below for each day you enable.
            </p>
          </div>

          <div className="availability-day-row" role="group" aria-label="Days of the week">
            {WEEK_DAY_ORDER.map((day) => {
              const enabled = enabledDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={readOnly}
                  onClick={() => handleToggleDay(day)}
                  className={`availability-day-circle ${enabled ? 'availability-day-circle-on' : ''}`}
                  aria-pressed={enabled}
                  aria-label={`${dayLabelFull(day)}${enabled ? ', available' : ', unavailable'}`}
                  title={
                    readOnly
                      ? dayLabel(day)
                      : enabled
                        ? `${dayLabel(day)} — tap to remove`
                        : `${dayLabel(day)} — tap to add`
                  }
                >
                  <span>{dayLabel(day).slice(0, 1)}</span>
                </button>
              );
            })}
          </div>
        </section>

        {enabledDays.length === 0 ? (
          <p className="availability-off-note">
            No days selected — you will not receive open jobs or shift alerts until you enable at least
            one day.
          </p>
        ) : (
          <div className="availability-day-cards">
            {enabledDays.map((day) => {
              const daySlots = slotsForWeekDay(schedule.weeklySlots, day);
              const hasInvalid = daySlots.some(isInvalidAvailabilityWindow);
              return (
                <article
                  key={day}
                  className={`guard-factor-card availability-day-card ${
                    hasInvalid ? 'guard-factor-card-low' : 'guard-factor-card-very-high'
                  }`}
                >
                  <div className="availability-day-card-head">
                    <h3 className="availability-day-card-title">{dayLabelFull(day)}</h3>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => handleToggleDay(day)}
                        className="availability-day-off-btn"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="availability-day-card-slots">
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
                              onClick={() => removeSlot(day, slot.id)}
                              className="availability-slot-remove"
                              aria-label={`Remove ${dayLabel(day)} availability slot`}
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
                    <div className="availability-day-card-actions">
                      <span className="availability-window-count">
                        {daySlots.length} window{daySlots.length === 1 ? '' : 's'}
                      </span>
                      <button type="button" onClick={() => addSlot(day)} className="availability-add-slot">
                        <Plus className="w-4 h-4" />
                        Add another window
                      </button>
                    </div>
                  )}
                  <div className="guard-factor-card-footer availability-day-card-footer">
                    <span className="guard-factor-card-points">
                      {daySlots.map((slot) => `${slot.startTime}–${slot.endTime}`).join(', ')}
                    </span>
                    <span className="guard-factor-card-status guard-factor-status-very-high">
                      <span className="guard-factor-status-dot" />
                      Active
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
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

          <div className="availability-dates-wrap">
            <GuardAvailabilityDatesPanel guardId={guardId} />
          </div>
        </div>
      </div>
    </>
  );
}
