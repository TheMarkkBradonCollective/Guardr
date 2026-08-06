import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityRequest } from '../types';
import {
  applyGuardShiftTimeAdjustment,
  computeWorkedHours,
  getEffectiveClockIn,
  getEffectiveClockOut,
  listGuardTimesheetEntries,
  validateGuardShiftTimeRange,
} from './guardTimesheet';

function sampleRequest(overrides: Partial<SecurityRequest> = {}): SecurityRequest {
  return {
    id: 'req-1',
    title: 'Night patrol',
    clientId: 'client-1',
    clientName: 'Acme',
    state: 'CA',
    city: 'Los Angeles',
    address: '1 Main St',
    startDate: '2026-08-01T20:00:00.000Z',
    endDate: '2026-08-02T04:00:00.000Z',
    durationHours: 8,
    hourlyRate: 35,
    estimatedPayout: 280,
    guardsNeeded: 1,
    status: 'completed',
    assignedGuardId: 'guard-1',
    checkInAudit: { checkedAt: '2026-08-01T19:55:00.000Z', uniform: {} as any, equipment: {} as any, selfieUpload: '', gpsVerified: true },
    checkOutAudit: { checkedAt: '2026-08-02T04:10:00.000Z', completed: true, noViolations: true, noEquipmentIssues: true, dailyActivityReport: 'All clear', clientNotes: '' },
    ...overrides,
  } as SecurityRequest;
}

describe('guardTimesheet', () => {
  it('uses recorded clock times by default', () => {
    const req = sampleRequest();
    assert.equal(getEffectiveClockIn(req), '2026-08-01T19:55:00.000Z');
    assert.equal(getEffectiveClockOut(req), '2026-08-02T04:10:00.000Z');
  });

  it('prefers staff adjustments over recorded times', () => {
    const req = sampleRequest({
      shiftTimeAdjustment: {
        clockInAt: '2026-08-01T20:00:00.000Z',
        clockOutAt: '2026-08-02T04:00:00.000Z',
        adjustedAt: '2026-08-03T12:00:00.000Z',
        adjustedById: 'staff-1',
      },
    });
    assert.equal(getEffectiveClockIn(req), '2026-08-01T20:00:00.000Z');
    assert.equal(getEffectiveClockOut(req), '2026-08-02T04:00:00.000Z');
  });

  it('lists guard shifts with worked hours', () => {
    const entries = listGuardTimesheetEntries([sampleRequest()], 'guard-1');
    assert.equal(entries.length, 1);
    assert.equal(entries[0].workedHours, computeWorkedHours('2026-08-01T19:55:00.000Z', '2026-08-02T04:10:00.000Z'));
    assert.equal(entries[0].adjusted, false);
  });

  it('validates clock-out after clock-in', () => {
    assert.equal(
      validateGuardShiftTimeRange('2026-08-02T04:00:00.000Z', '2026-08-01T20:00:00.000Z'),
      'Clock-out must be after clock-in.',
    );
  });

  it('applies staff shift time adjustments', () => {
    const updated = applyGuardShiftTimeAdjustment(
      sampleRequest(),
      {
        clockInAt: '2026-08-01T20:00:00.000Z',
        clockOutAt: '2026-08-02T04:00:00.000Z',
        note: 'Rounded to schedule',
      },
      { id: 'staff-1', email: 'ops@guardr.test' },
    );
    assert.equal(updated.shiftTimeAdjustment?.clockInAt, '2026-08-01T20:00:00.000Z');
    assert.equal(updated.shiftTimeAdjustment?.note, 'Rounded to schedule');
  });
});
