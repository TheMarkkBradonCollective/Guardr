import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createDateOverride,
  createOffDayOverride,
  defaultAvailabilitySlots,
  filterGuardsAvailableForJob,
  getEnabledWeekDays,
  guardIsAvailableForJob,
  isInvalidAvailabilityWindow,
  isWeekDayEnabled,
  loadAvailabilitySlots,
  prunePastDateOverrides,
  saveAvailabilitySlots,
  toggleWeekDay,
  windowsForDate,
} from './guardAvailability.ts';

describe('isInvalidAvailabilityWindow', () => {
  it('flags end time equal to start time', () => {
    assert.equal(isInvalidAvailabilityWindow({ startTime: '09:00', endTime: '09:00' }), true);
  });

  it('flags end time before start time', () => {
    assert.equal(isInvalidAvailabilityWindow({ startTime: '17:00', endTime: '09:00' }), true);
  });

  it('allows end time after start time', () => {
    assert.equal(isInvalidAvailabilityWindow({ startTime: '08:00', endTime: '18:00' }), false);
  });
});

describe('defaultAvailabilitySlots', () => {
  it('returns weekday slots that are all valid windows', () => {
    const slots = defaultAvailabilitySlots('guard-1');
    assert.equal(slots.length, 5);
    for (const slot of slots) {
      assert.equal(isInvalidAvailabilityWindow(slot), false);
    }
  });
});

describe('toggleWeekDay', () => {
  it('enables a disabled day with a default window', () => {
    const slots = defaultAvailabilitySlots('guard-1');
    const next = toggleWeekDay(slots, 'guard-1', 6, true);
    assert.equal(isWeekDayEnabled(next, 6), true);
    assert.ok(next.some((slot) => slot.dayOfWeek === 6));
  });

  it('disables a day by removing its slots', () => {
    const slots = defaultAvailabilitySlots('guard-1');
    const next = toggleWeekDay(slots, 'guard-1', 1, false);
    assert.equal(isWeekDayEnabled(next, 1), false);
  });
});

describe('guardIsAvailableForJob', () => {
  const schedule = {
    weeklySlots: defaultAvailabilitySlots('guard-1'),
    dateOverrides: [],
  };

  it('matches a Monday job inside default hours', () => {
    const job = {
      startDate: '2026-07-20T10:00:00',
      endDate: '2026-07-20T14:00:00',
    };
    assert.equal(guardIsAvailableForJob('guard-1', job, schedule), true);
  });

  it('rejects a Sunday job when Sunday is disabled', () => {
    const job = {
      startDate: '2026-07-19T10:00:00',
      endDate: '2026-07-19T14:00:00',
    };
    assert.equal(guardIsAvailableForJob('guard-1', job, schedule), false);
  });

  it('rejects a job outside configured hours', () => {
    const job = {
      startDate: '2026-07-20T20:00:00',
      endDate: '2026-07-20T22:00:00',
    };
    assert.equal(guardIsAvailableForJob('guard-1', job, schedule), false);
  });

  it('rejects a job on a specific off-day override', () => {
    const monday = '2026-07-20';
    const withOffDay = {
      weeklySlots: schedule.weeklySlots,
      dateOverrides: [createOffDayOverride({ guardId: 'guard-1', date: monday })],
    };
    const job = {
      startDate: `${monday}T10:00:00`,
      endDate: `${monday}T14:00:00`,
    };
    assert.equal(guardIsAvailableForJob('guard-1', job, withOffDay), false);
  });
});

describe('prunePastDateOverrides', () => {
  it('removes overrides before today', () => {
    const today = new Date();
    const past = new Date(today);
    past.setDate(past.getDate() - 2);
    const future = new Date(today);
    future.setDate(future.getDate() + 2);
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const pruned = prunePastDateOverrides([
      createDateOverride({ guardId: 'g1', date: fmt(past) }),
      createDateOverride({ guardId: 'g1', date: fmt(future) }),
    ]);
    assert.equal(pruned.length, 1);
    assert.equal(pruned[0].date, fmt(future));
  });
});

describe('getEnabledWeekDays', () => {
  it('returns only days with available slots', () => {
    const days = getEnabledWeekDays(defaultAvailabilitySlots('guard-1'));
    assert.deepEqual(days, [1, 2, 3, 4, 5]);
  });
});

describe('load/saveAvailabilitySlots (no localStorage in this test environment)', () => {
  it('loadAvailabilitySlots returns null without throwing', () => {
    assert.equal(loadAvailabilitySlots('guard-1'), null);
  });

  it('saveAvailabilitySlots does not throw', () => {
    assert.doesNotThrow(() => saveAvailabilitySlots('guard-1', defaultAvailabilitySlots('guard-1')));
  });
});

describe('filterGuardsAvailableForJob', () => {
  it('excludes guards when the shift falls outside default weekday availability', () => {
    const guards = [{ id: 'guard-1' }, { id: 'guard-2' }];
    const sundayJob = {
      startDate: '2026-07-19T10:00:00',
      endDate: '2026-07-19T14:00:00',
    };
    assert.equal(filterGuardsAvailableForJob(guards, sundayJob).length, 0);

    const mondayJob = {
      startDate: '2026-07-20T10:00:00',
      endDate: '2026-07-20T14:00:00',
    };
    assert.equal(filterGuardsAvailableForJob(guards, mondayJob).length, 2);
  });
});

describe('windowsForDate', () => {
  it('returns weekly windows when no override exists', () => {
    const monday = new Date('2026-07-20T12:00:00');
    const windows = windowsForDate(
      { weeklySlots: defaultAvailabilitySlots('guard-1'), dateOverrides: [] },
      monday
    );
    assert.equal(windows.length, 1);
    assert.equal(windows[0].startTime, '08:00');
  });

  it('returns no windows when the date is marked off', () => {
    const monday = new Date('2026-07-20T12:00:00');
    const windows = windowsForDate(
      {
        weeklySlots: defaultAvailabilitySlots('guard-1'),
        dateOverrides: [createOffDayOverride({ guardId: 'guard-1', date: '2026-07-20' })],
      },
      monday
    );
    assert.equal(windows.length, 0);
  });
});
