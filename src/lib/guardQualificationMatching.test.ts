import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SecurityGuard, SecurityRequest } from '../types';
import { rankGuardsForJob } from './guardQualificationMatching';

function baseGuard(id: string, rating: number): SecurityGuard {
  return {
    id,
    name: `Guard ${id}`,
    email: `${id}@test.com`,
    badgeNumber: id,
    avatar: '',
    phone: '',
    bio: '',
    isArmed: false,
    backgroundChecked: true,
    verified: true,
    rating,
    jobsCompleted: 5,
    certifications: [],
    experience: [],
  };
}

function baseJob(applicants: string[]): SecurityRequest {
  return {
    id: 'job-1',
    title: 'Retail patrol',
    description: '',
    clientId: 'c1',
    clientName: 'Client',
    clientLogo: '',
    location: 'Sacramento, CA',
    type: 'patrol',
    armedRequired: false,
    startDate: new Date(Date.now() + 86_400_000).toISOString(),
    endDate: new Date(Date.now() + 94_400_000).toISOString(),
    durationHours: 2,
    hourlyRate: 40,
    estimatedPayout: 80,
    status: 'open',
    assignedGuardId: null,
    requiredCertifications: [],
    applicants,
  };
}

describe('rankGuardsForJob', () => {
  it('ranks higher-rated applicants first when requirements match', () => {
    const job = baseJob(['g-low', 'g-high']);
    const guards = [baseGuard('g-low', 3.5), baseGuard('g-high', 4.9)];
    const ranked = rankGuardsForJob(job, guards, { applicantsOnly: true });
    assert.equal(ranked[0]?.guard.id, 'g-high');
  });
});
