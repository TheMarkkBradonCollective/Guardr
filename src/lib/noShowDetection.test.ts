import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SecurityRequest } from '../types';
import { isGuardNoShow } from './noShowDetection';

describe('isGuardNoShow', () => {
  it('detects no-show after grace period', () => {
    const start = new Date('2026-01-01T18:00:00Z');
    const job: SecurityRequest = {
      id: 'j1',
      title: 'Shift',
      description: '',
      clientId: 'c1',
      clientName: 'Client',
      clientLogo: '',
      location: 'Site',
      type: 'patrol',
      armedRequired: false,
      startDate: start.toISOString(),
      endDate: new Date(start.getTime() + 3_600_000).toISOString(),
      durationHours: 1,
      hourlyRate: 30,
      estimatedPayout: 30,
      status: 'accepted',
      assignedGuardId: 'g1',
      requiredCertifications: [],
      applicants: ['g1'],
    };
    const afterGrace = start.getTime() + 25 * 60_000;
    assert.equal(isGuardNoShow(job, afterGrace), true);
  });
});
