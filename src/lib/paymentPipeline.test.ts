import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SecurityRequest } from '../types';
import { paymentPipelineSummary, pipelineStageRequests } from './paymentPipeline';

const completedPaidJob = {
  id: 'job-1',
  title: 'Night shift',
  clientName: 'Client',
  status: 'completed',
  paymentStatus: 'paid',
  estimatedPayout: 200,
  durationHours: 4,
  hourlyRate: 50,
  startDate: '2026-07-01T10:00:00Z',
  endDate: '2026-07-01T14:00:00Z',
  assignedGuardId: 'guard-1',
} as SecurityRequest;

describe('paymentPipelineSummary stage lookup', () => {
  it('maps kebab-case pipeline stages to summary groups', () => {
    const summary = paymentPipelineSummary([completedPaidJob]);

    assert.equal(pipelineStageRequests(summary, 'awaiting-guard-payout').length, 1);
    assert.equal(pipelineStageRequests(summary, 'awaiting-guard-payout')[0]?.id, 'job-1');
    assert.equal(pipelineStageRequests(summary, 'awaiting-client').length, 0);
  });
});
