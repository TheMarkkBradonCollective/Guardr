import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import {
  dayLabel,
  defaultAvailabilitySlots,
  isInvalidAvailabilityWindow,
  loadAvailabilitySlots,
  saveAvailabilitySlots,
  WEEK_DAY_ORDER,
  WEEK_DAY_TAB_OPTIONS,
  type GuardAvailabilitySlot,
} from '../../lib/guardAvailability';
import { showAppToast } from '../ui/AppToast';

interface GuardAvailabilityCalendarProps {
  guardId: string;
  slots?: GuardAvailabilitySlot[];
  onSave?: (slots: GuardAvailabilitySlot[]) => void | Promise<void>;
  readOnly?: boolean;
}

function defaultSelectedDay(): number {
  const today = new Date().getDay();
  return WEEK_DAY_ORDER.includes(today as (typeof WEEK_DAY_ORDER)[number]) ? today : 1;
}

export function GuardAvailabilityCalendar({
  guardId,
  slots: initialSlots,
  onSave,
  readOnly = false,
}: GuardAvailabilityCalendarProps) {
  const [slots, setSlots] = useState<GuardAvailabilitySlot[]>(
    initialSlots?.length ? initialSlots : loadAvailabilitySlots(guardId) ?? defaultAvailabilitySlots(guardId)
  );
  const [selectedDay, setSelectedDay] = useState<number>(defaultSelectedDay);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const daySlots = slots.filter((slot) => slot.dayOfWeek === selectedDay);

  const updateSlot = (id: string, patch: Partial<GuardAvailabilitySlot>) => {
    setSlots((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    setDirty(true);
  };

  const handleSave = async () => {
    const invalid = slots.find(isInvalidAvailabilityWindow);
    if (invalid) {
      showAppToast('Fix the highlighted time range before saving', {
        body: `${dayLabel(invalid.dayOfWeek)}: end time must be after start time.`,
        tone: 'error',
      });
      return;
    }
    setSaving(true);
    try {
      saveAvailabilitySlots(guardId, slots);
      await onSave?.(slots);
      setDirty(false);
      showAppToast('Availability saved', { tone: 'success' });
    } catch (err) {
      showAppToast(err instanceof Error ? err.message : 'Could not save availability.', { tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const addSlot = () => {
    setSlots((prev) => [
      ...prev,
      {
        id: `avail-${guardId}-${Date.now()}`,
        guardId,
        dayOfWeek: selectedDay,
        startTime: '09:00',
        endTime: '17:00',
        isAvailable: true,
      },
    ]);
    setDirty(true);
  };

  const removeSlot = (id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
    setDirty(true);
  };

  return (
    <div className="guard-availability-panel">
      <div className="guard-availability-day-tabs" role="tablist" aria-label="Day of week">
        {WEEK_DAY_TAB_OPTIONS.map((option) => {
          const day = Number(option.id);
          const active = selectedDay === day;
          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedDay(day)}
              className={`guard-availability-day-tab ${active ? 'guard-availability-day-tab-active' : ''}`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="guard-availability-body">
        {daySlots.length === 0 ? (
          <p className="guard-availability-empty">
            No availability on {dayLabel(selectedDay)} — add a time window below, or leave empty if you are not
            available this day.
          </p>
        ) : (
          <div className="guard-availability-slots">
            {daySlots.map((slot) => {
              const invalidWindow = isInvalidAvailabilityWindow(slot);
              return (
                <div
                  key={slot.id}
                  className={`guard-availability-slot-row ${invalidWindow ? 'guard-availability-slot-row-invalid' : ''}`}
                >
                  <div className="guard-availability-slot-times">
                    <input
                      type="time"
                      value={slot.startTime}
                      disabled={readOnly}
                      onChange={(e) => updateSlot(slot.id, { startTime: e.target.value })}
                      aria-invalid={invalidWindow}
                      className="guard-availability-time-input"
                    />
                    <span className="guard-availability-slot-separator">to</span>
                    <input
                      type="time"
                      value={slot.endTime}
                      disabled={readOnly}
                      onChange={(e) => updateSlot(slot.id, { endTime: e.target.value })}
                      aria-invalid={invalidWindow}
                      className="guard-availability-time-input"
                    />
                  </div>
                  <div className="guard-availability-slot-actions">
                    <label className="guard-availability-available-toggle">
                      <input
                        type="checkbox"
                        checked={slot.isAvailable}
                        disabled={readOnly}
                        onChange={(e) => updateSlot(slot.id, { isAvailable: e.target.checked })}
                      />
                      Available
                    </label>
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={() => removeSlot(slot.id)}
                        className="guard-availability-remove"
                        aria-label={`Remove ${dayLabel(selectedDay)} availability slot`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {invalidWindow && (
                    <p className="guard-availability-slot-error">End time must be after start time.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {!readOnly && (
        <div className="guard-availability-actions">
          <button type="button" onClick={addSlot} className="app-button-outline app-btn-sm flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add slot
          </button>
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
