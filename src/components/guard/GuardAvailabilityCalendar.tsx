import React, { useState } from 'react';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import {
  dayLabel,
  defaultAvailabilitySlots,
  isInvalidAvailabilityWindow,
  loadAvailabilitySlots,
  saveAvailabilitySlots,
  type GuardAvailabilitySlot,
} from '../../lib/guardAvailability';
import { showAppToast } from '../ui/AppToast';

interface GuardAvailabilityCalendarProps {
  guardId: string;
  slots?: GuardAvailabilitySlot[];
  onSave?: (slots: GuardAvailabilitySlot[]) => void | Promise<void>;
  readOnly?: boolean;
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
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

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
      // Always persist locally so edits survive refresh/navigation even
      // when no server-backed onSave is wired up by the parent screen.
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
    const day = 1;
    setSlots((prev) => [
      ...prev,
      {
        id: `avail-${guardId}-${Date.now()}`,
        guardId,
        dayOfWeek: day,
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
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-brand-primary" />
        <h3 className="text-base font-bold text-brand-text">Availability</h3>
      </div>
      <p className="text-sm text-brand-text-muted">Set when you are available for security work.</p>
      {slots.length === 0 ? (
        <p className="text-sm text-brand-text-muted italic py-2">
          No availability windows set — you may still be offered jobs any day. Add a slot below to limit which days you're contacted.
        </p>
      ) : (
        <div className="space-y-2">
          {slots.map((slot) => {
            const invalidWindow = isInvalidAvailabilityWindow(slot);
            return (
              <div
                key={slot.id}
                className={`flex flex-wrap items-center gap-2 p-3 rounded-xl border bg-brand-surface ${
                  invalidWindow ? 'border-red-500/50' : 'border-brand-border'
                }`}
              >
                <select
                  value={slot.dayOfWeek}
                  disabled={readOnly}
                  onChange={(e) => updateSlot(slot.id, { dayOfWeek: Number(e.target.value) })}
                  className="uber-input text-sm w-24"
                >
                  {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                    <option key={d} value={d}>{dayLabel(d)}</option>
                  ))}
                </select>
                <input
                  type="time"
                  value={slot.startTime}
                  disabled={readOnly}
                  onChange={(e) => updateSlot(slot.id, { startTime: e.target.value })}
                  aria-invalid={invalidWindow}
                  className="uber-input text-sm w-28"
                />
                <span className="text-brand-text-muted">to</span>
                <input
                  type="time"
                  value={slot.endTime}
                  disabled={readOnly}
                  onChange={(e) => updateSlot(slot.id, { endTime: e.target.value })}
                  aria-invalid={invalidWindow}
                  className="uber-input text-sm w-28"
                />
                <label className="flex items-center gap-1 text-sm ml-auto">
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
                    className="p-1 text-brand-text-muted hover:text-red-500"
                    aria-label={`Remove ${dayLabel(slot.dayOfWeek)} availability slot`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                {invalidWindow && (
                  <p className="text-xs text-red-500 basis-full">End time must be after start time.</p>
                )}
              </div>
            );
          })}
        </div>
      )}
      {!readOnly && (
        <div className="flex gap-2">
          <button type="button" onClick={addSlot} className="uber-btn uber-btn-secondary text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" /> Add slot
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || !dirty}
            className="uber-btn uber-btn-primary text-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : dirty ? 'Save availability' : 'Saved'}
          </button>
        </div>
      )}
    </div>
  );
}
