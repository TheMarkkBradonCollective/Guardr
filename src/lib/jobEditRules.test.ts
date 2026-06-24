import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityRequest } from '../types';
import {
  canEditJobSchedule,
  canEditUnpaidJobSchedule,
  canStaffEditUnpaidJobSchedule,
  isJobPaid,
} from './jobEditRules.ts';

function baseJob(overrides: Partial<SecurityRequest> = {}): SecurityRequest {
  return {
    id: 'job-1',
    title: 'Test',
    description: '',
    clientId: 'client-1',
    clientName: 'Client',
    clientLogo: '',
    location: 'Site',
    type: 'event',
    armedRequired: false,
    startDate: '2026-07-01T10:00:00.000Z',
    endDate: '2026-07-01T18:00:00.000Z',
    durationHours: 8,
    hourlyRate: 30,
    estimatedPayout: 240,
    status: 'accepted',
    assignedGuardId: 'guard-1',
    paymentStatus: 'unpaid',
    requiredCertifications: [],
    applicants: [],
    ...overrides,
  };
}

describe('jobEditRules unpaid schedule', () => {
  it('treats unpaid as editable regardless of paymentStatus unset', () => {
    assert.equal(isJobPaid({ paymentStatus: 'unpaid' }), false);
    assert.equal(isJobPaid({ paymentStatus: undefined }), false);
  });

  it('allows schedule edits on unpaid accepted and in-progress jobs', () => {
    assert.equal(canEditUnpaidJobSchedule(baseJob({ status: 'accepted' })), true);
    assert.equal(canEditUnpaidJobSchedule(baseJob({ status: 'in-progress' })), true);
    assert.equal(canEditUnpaidJobSchedule(baseJob({ status: 'open' })), true);
    assert.equal(canEditUnpaidJobSchedule(baseJob({ status: 'pending-review' })), true);
  });

  it('blocks unpaid schedule edits after job is closed', () => {
    assert.equal(canEditUnpaidJobSchedule(baseJob({ status: 'closed' })), false);
  });

  it('blocks schedule edits once paid', () => {
    assert.equal(canEditJobSchedule(baseJob({ paymentStatus: 'paid', status: 'open' })), false);
  });

  it('lets staff edit unpaid schedules on active jobs', () => {
    assert.equal(canStaffEditUnpaidJobSchedule(baseJob({ status: 'in-progress' }), 'administrator'), true);
    assert.equal(canStaffEditUnpaidJobSchedule(baseJob({ status: 'completed' }), 'director'), true);
    assert.equal(canStaffEditUnpaidJobSchedule(baseJob({ status: 'closed' }), 'director'), false);
  });
});
