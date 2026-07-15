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
  it('always returns false — clients handle guard placement', () => {
    assert.equal(jobNeedsStaffApplicationReview(job({ id: 'j1' })), false);
    assert.equal(
      jobNeedsStaffApplicationReview(job({ id: 'j2', pendingGuardId: 'guard-1' })),
      false
    );
  });
});

describe('getJobsNeedingStaffApplicationReview', () => {
  it('returns an empty list', () => {
    const requests = [
      job({ id: 'needs-review' }),
      job({ id: 'awaiting-client', pendingGuardId: 'guard-2' }),
    ];
    assert.equal(getJobsNeedingStaffApplicationReview(requests).length, 0);
  });
});
