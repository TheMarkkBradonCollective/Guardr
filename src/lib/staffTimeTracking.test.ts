import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeStaffPayoutAdjustment,
  computeStaffPayoutFinalAmount,
} from './staffCompensation';
import {
  entryHoursInPeriod,
  formatTrackedHours,
  sumStaffHoursInPeriod,
  type StaffTimeEntry,
} from './staffTimeTracking';

test('computeStaffPayoutAdjustment adds hourly and manual bonus only', () => {
  const result = computeStaffPayoutAdjustment({
    choice: 'custom',
    includeHourlyPay: true,
    trackedHours: 10,
    hourlyRate: 20,
    manualAdjustment: 15,
  });
  assert.equal(result.hourlyAmount, 200);
  assert.equal(result.manualAdjustmentAmount, 15);
  assert.equal(result.totalAdjustment, 215);
});

test('computeStaffPayoutAdjustment clamps manual bonus to zero', () => {
  const result = computeStaffPayoutAdjustment({
    choice: 'custom',
    includeHourlyPay: false,
    trackedHours: 5,
    hourlyRate: 20,
    manualAdjustment: -50,
  });
  assert.equal(result.manualAdjustmentAmount, 0);
  assert.equal(result.totalAdjustment, 0);
});

test('computeStaffPayoutAdjustment returns zero when choice is none', () => {
  const result = computeStaffPayoutAdjustment({
    choice: 'none',
    includeHourlyPay: true,
    trackedHours: 10,
    hourlyRate: 20,
    manualAdjustment: 100,
  });
  assert.equal(result.totalAdjustment, 0);
});

test('computeStaffPayoutFinalAmount combines revenue share and add-ons', () => {
  const total = computeStaffPayoutFinalAmount(100, {
    choice: 'custom',
    includeHourlyPay: true,
    trackedHours: 2,
    hourlyRate: 25,
    manualAdjustment: 10,
  });
  assert.equal(total, 160);
});

test('sumStaffHoursInPeriod totals completed and active entries', () => {
  const entries: StaffTimeEntry[] = [
    {
      id: '1',
      staffId: 'staff-1',
      staffName: 'Alex',
      clockInAt: '2026-08-04T09:00:00.000Z',
      clockOutAt: '2026-08-04T17:00:00.000Z',
      createdAt: '2026-08-04T09:00:00.000Z',
    },
    {
      id: '2',
      staffId: 'staff-1',
      staffName: 'Alex',
      clockInAt: '2026-08-05T10:00:00.000Z',
      createdAt: '2026-08-05T10:00:00.000Z',
    },
  ];
  const periodStart = '2026-08-04T00:00:00.000Z';
  const periodEnd = '2026-08-10T23:59:59.999Z';
  const total = sumStaffHoursInPeriod(
    entries,
    'staff-1',
    periodStart,
    periodEnd,
    new Date('2026-08-05T12:00:00.000Z'),
  );
  assert.equal(total, 10);
});

test('entryHoursInPeriod ignores time outside pay period', () => {
  const entry: StaffTimeEntry = {
    id: '1',
    staffId: 'staff-1',
    staffName: 'Alex',
    clockInAt: '2026-08-01T09:00:00.000Z',
    clockOutAt: '2026-08-06T17:00:00.000Z',
    createdAt: '2026-08-01T09:00:00.000Z',
  };
  const hours = entryHoursInPeriod(
    entry,
    '2026-08-04T00:00:00.000Z',
    '2026-08-10T23:59:59.999Z',
  );
  assert.ok(hours > 0);
  assert.ok(hours < 120);
});

test('formatTrackedHours renders hours and minutes', () => {
  assert.equal(formatTrackedHours(1.5), '1h 30m');
});
