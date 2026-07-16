import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityRequest } from '../types';
import { isJobMissed, splitCompletedAndMissed } from './jobTallies.ts';

function job(partial: Partial<SecurityRequest> & Pick<SecurityRequest, 'id'>): SecurityRequest {
  return {
    id: partial.id,
    title: partial.title ?? 'Shift',
    clientId: partial.clientId ?? 'client-1',
    clientName: partial.clientName ?? 'Client',
    location: partial.location ?? 'Site',
    startDate: partial.startDate ?? '2026-08-01T12:00:00.000Z',
    endDate: partial.endDate ?? '2026-08-01T20:00:00.000Z',
    hourlyRate: partial.hourlyRate ?? 40,
    status: partial.status ?? 'completed',
    applicants: partial.applicants ?? [],
    assignedGuardId: partial.assignedGuardId,
    guardSlots: partial.guardSlots,
    noShow: partial.noShow,
    replacementRequest: partial.replacementRequest,
    checkInAudit: partial.checkInAudit,
  } as SecurityRequest;
}

describe('isJobMissed', () => {
  it('flags explicit no-show', () => {
    assert.equal(isJobMissed(job({ id: '1', noShow: true })), true);
  });

  it('flags call-off and no-show replacement reasons', () => {
    assert.equal(
      isJobMissed(
        job({
          id: '2',
          replacementRequest: {
            id: 'rep-1',
            requestedAt: '2026-08-01T10:00:00.000Z',
            requestedBy: 'client',
            reason: 'call-off',
            status: 'offering',
            offeredGuardIds: [],
          },
        })
      ),
      true
    );
    assert.equal(
      isJobMissed(
        job({
          id: '3',
          replacementRequest: {
            id: 'rep-2',
            requestedAt: '2026-08-01T10:00:00.000Z',
            requestedBy: 'system',
            reason: 'no-show',
            status: 'filled',
            offeredGuardIds: [],
          },
        })
      ),
      true
    );
  });

  it('splits completed and missed jobs', () => {
    const jobs = [
      job({ id: 'ok', status: 'completed' }),
      job({ id: 'missed', status: 'completed', noShow: true }),
    ];
    const { completed, missed } = splitCompletedAndMissed(jobs);
    assert.deepEqual(
      completed.map((j) => j.id),
      ['ok']
    );
    assert.deepEqual(
      missed.map((j) => j.id),
      ['missed']
    );
  });
});
