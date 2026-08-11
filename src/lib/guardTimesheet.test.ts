import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityRequest } from '../types';
import {
  computeWorkedHours,
  getEffectiveClockIn,
  getEffectiveClockOut,
  listGuardTimesheetEntries,
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
  it('uses recorded clock times from check-in/out audit', () => {
    const req = sampleRequest();
    assert.equal(getEffectiveClockIn(req), '2026-08-01T19:55:00.000Z');
    assert.equal(getEffectiveClockOut(req), '2026-08-02T04:10:00.000Z');
  });

  it('falls back to scheduled start when guard has not clocked in', () => {
    const req = sampleRequest({
      checkInAudit: undefined,
      checkOutAudit: undefined,
      status: 'in-progress',
    });
    assert.equal(getEffectiveClockIn(req), '2026-08-01T20:00:00.000Z');
    assert.equal(getEffectiveClockOut(req), undefined);
  });

  it('lists guard shifts with worked hours', () => {
    const entries = listGuardTimesheetEntries([sampleRequest()], 'guard-1');
    assert.equal(entries.length, 1);
    assert.equal(entries[0].workedHours, computeWorkedHours('2026-08-01T19:55:00.000Z', '2026-08-02T04:10:00.000Z'));
  });
});
