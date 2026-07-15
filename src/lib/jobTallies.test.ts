import { describe, expect, it } from 'vitest';
import type { SecurityRequest } from '../types';
import { isJobMissed, splitCompletedAndMissed } from './jobTallies';

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
    expect(isJobMissed(job({ id: '1', noShow: true }))).toBe(true);
  });

  it('flags call-off and no-show replacement reasons', () => {
    expect(
      isJobMissed(
        job({
          id: '2',
          replacementRequest: { reason: 'call-off', status: 'offering', offeredGuardIds: [] },
        })
      )
    ).toBe(true);
    expect(
      isJobMissed(
        job({
          id: '3',
          replacementRequest: { reason: 'no-show', status: 'filled', offeredGuardIds: [] },
        })
      )
    ).toBe(true);
  });

  it('splits completed and missed jobs', () => {
    const jobs = [
      job({ id: 'ok', status: 'completed' }),
      job({ id: 'missed', status: 'completed', noShow: true }),
    ];
    const { completed, missed } = splitCompletedAndMissed(jobs);
    expect(completed.map((j) => j.id)).toEqual(['ok']);
    expect(missed.map((j) => j.id)).toEqual(['missed']);
  });
});
