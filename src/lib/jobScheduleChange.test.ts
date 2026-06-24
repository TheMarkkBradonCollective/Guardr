import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityRequest } from '../types';
import {
  guardsToNotifyForScheduleChange,
  hasScheduleDateChange,
  isDurationExtension,
  paidScheduleDurationHours,
  resolveScheduleChangeAfterApproval,
  scheduleChangeRequiresStaffApproval,
} from './jobScheduleChange.ts';

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
    paymentStatus: 'paid',
    clientPaymentMethod: 'stripe',
    requiredCertifications: [],
    applicants: [],
    ...overrides,
  };
}

describe('jobScheduleChange', () => {
  it('uses scheduled duration when billing was adjusted', () => {
    assert.equal(paidScheduleDurationHours({ durationHours: 10, scheduledDurationHours: 8 }), 8);
  });

  it('detects date changes', () => {
    const job = baseJob();
    assert.equal(
      hasScheduleDateChange(job, '2026-07-01T12:00:00.000Z', '2026-07-01T20:00:00.000Z'),
      true
    );
    assert.equal(hasScheduleDateChange(job, job.startDate, job.endDate), false);
  });

  it('requires staff approval for cash and duration extensions', () => {
    const stripeJob = baseJob();
    assert.equal(scheduleChangeRequiresStaffApproval(stripeJob, 8), false);
    assert.equal(scheduleChangeRequiresStaffApproval(stripeJob, 9), true);

    const cashJob = baseJob({ clientPaymentMethod: 'cash' });
    assert.equal(scheduleChangeRequiresStaffApproval(cashJob, 8), true);
  });

  it('collects assigned and crew guards for notifications', () => {
    const job = baseJob({
      guardSlots: [
        { id: 's1', jobId: 'job-1', slotIndex: 0, isLead: false, guardId: 'guard-2', status: 'approved' },
      ],
    });
    const ids = guardsToNotifyForScheduleChange(job);
    assert.deepEqual(ids.sort(), ['guard-1', 'guard-2']);
  });

  it('flags duration extension with tolerance', () => {
    assert.equal(isDurationExtension(8, 8.005), false);
    assert.equal(isDurationExtension(8, 8.02), true);
  });

  it('staff client-initiated extension on stripe awaits payment after staff approval', () => {
    const job = baseJob({
      scheduleChangeRequestedBy: 'client',
      pendingDurationHours: 10,
      pendingEstimatedPayout: 300,
    });
    assert.deepEqual(resolveScheduleChangeAfterApproval(job, 'staff'), {
      action: 'awaiting_payment',
      extraAmount: 60,
    });
  });

  it('staff client-initiated same duration on stripe applies immediately', () => {
    const job = baseJob({
      scheduleChangeRequestedBy: 'client',
      pendingDurationHours: 8,
      pendingStartDate: '2026-07-02T10:00:00.000Z',
      pendingEndDate: '2026-07-02T18:00:00.000Z',
    });
    assert.deepEqual(resolveScheduleChangeAfterApproval(job, 'staff'), { action: 'apply' });
  });

  it('staff-proposed change on cash job needs billing confirmation after client approval', () => {
    const job = baseJob({
      clientPaymentMethod: 'cash',
      scheduleChangeRequestedBy: 'staff',
      pendingDurationHours: 8,
    });
    assert.deepEqual(resolveScheduleChangeAfterApproval(job, 'client'), {
      action: 'pending_staff_billing',
      extraAmount: 0,
    });
  });

  it('staff-proposed extension on stripe awaits payment after client approval', () => {
    const job = baseJob({
      scheduleChangeRequestedBy: 'staff',
      pendingDurationHours: 10,
      pendingEstimatedPayout: 300,
    });
    assert.deepEqual(resolveScheduleChangeAfterApproval(job, 'client'), {
      action: 'awaiting_payment',
      extraAmount: 60,
    });
  });
});
