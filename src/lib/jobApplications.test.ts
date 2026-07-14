import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityRequest } from '../types';
import {
  getJobsNeedingStaffApplicationReview,
  jobNeedsStaffApplicationReview,
} from './jobApplications';

function job(partial: Partial<SecurityRequest> & Pick<SecurityRequest, 'id'>): SecurityRequest {
  return {
    title: 'Site Alpha',
    location: 'Los Angeles, CA',
    status: 'open',
    applicants: ['guard-1'],
    assignedGuardId: undefined,
    pendingGuardId: undefined,
    staffApprovedGuardAt: undefined,
    ...partial,
  } as SecurityRequest;
}

describe('jobNeedsStaffApplicationReview', () => {
  it('includes open jobs with applicants awaiting staff pick', () => {
    assert.equal(jobNeedsStaffApplicationReview(job({ id: 'j1' })), true);
  });

  it('excludes jobs awaiting client confirmation', () => {
    assert.equal(
      jobNeedsStaffApplicationReview(job({ id: 'j2', pendingGuardId: 'guard-1' })),
      false
    );
  });

  it('excludes jobs already sent to client', () => {
    assert.equal(
      jobNeedsStaffApplicationReview(
        job({ id: 'j3', staffApprovedGuardAt: '2026-07-14T00:00:00.000Z' })
      ),
      false
    );
  });

  it('excludes assigned or closed jobs', () => {
    assert.equal(
      jobNeedsStaffApplicationReview(job({ id: 'j4', assignedGuardId: 'guard-1' })),
      false
    );
    assert.equal(jobNeedsStaffApplicationReview(job({ id: 'j5', status: 'accepted' })), false);
  });
});

describe('getJobsNeedingStaffApplicationReview', () => {
  it('returns only staff-actionable application jobs', () => {
    const requests = [
      job({ id: 'needs-review' }),
      job({ id: 'awaiting-client', pendingGuardId: 'guard-2' }),
      job({ id: 'sent', staffApprovedGuardAt: '2026-07-14T00:00:00.000Z' }),
    ];
    const result = getJobsNeedingStaffApplicationReview(requests);
    assert.equal(result.length, 1);
    assert.equal(result[0]?.id, 'needs-review');
  });
});
