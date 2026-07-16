import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SecurityGuard, SecurityRequest } from '../types';
import { rankGuardsForJob, scoreGuardForJob } from './guardQualificationMatching';

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

function mondayJob(applicants: string[]): SecurityRequest {
  const job = baseJob(applicants);
  job.startDate = '2026-07-20T10:00:00';
  job.endDate = '2026-07-20T14:00:00';
  return job;
}

describe('rankGuardsForJob', () => {
  it('ranks higher-rated applicants first when requirements match', () => {
    const job = mondayJob(['g-low', 'g-high']);
    const guards = [baseGuard('g-low', 3.5), baseGuard('g-high', 4.9)];
    const ranked = rankGuardsForJob(job, guards, { applicantsOnly: true });
    assert.equal(ranked[0]?.guard.id, 'g-high');
  });

  it('silently excludes applicants when the shift is outside availability', () => {
    const job = mondayJob(['g-low', 'g-high']);
    job.startDate = '2026-07-19T10:00:00';
    job.endDate = '2026-07-19T14:00:00';

    const ranked = rankGuardsForJob(job, [baseGuard('g-low', 3.5), baseGuard('g-high', 4.9)], {
      applicantsOnly: true,
    });

    assert.equal(ranked.length, 0);
  });

  it('adds a larger tier boost for elite guards on premium jobs', () => {
    const job = mondayJob(['g-starting', 'g-elite']);
    job.hourlyRate = 50;
    job.guardPay = 42;

    const startingGuard = baseGuard('g-starting', 4.8);
    const eliteGuard = baseGuard('g-elite', 4.8);
    const eliteHistory = buildEliteHistory();

    const startingScore = scoreGuardForJob(startingGuard, job, []);
    const eliteScore = scoreGuardForJob(eliteGuard, job, eliteHistory);

    assert.equal(startingScore.factors.tierBoost, 0);
    assert.equal(eliteScore.factors.tierBoost, 18);
    assert.ok(eliteScore.totalScore > startingScore.totalScore);

    const ranked = rankGuardsForJob(job, [startingGuard, eliteGuard], {
      applicantsOnly: true,
      allRequests: eliteHistory,
    });
    assert.equal(ranked[0]?.guard.id, 'g-elite');
  });
});

function buildEliteHistory(): SecurityRequest[] {
  return [
    {
      ...baseJob(['g-elite']),
      id: 'elite-1',
      status: 'completed',
      assignedGuardId: 'g-elite',
      applicants: ['g-elite'],
      startDate: '2026-07-20T10:00:00',
      endDate: '2026-07-20T14:00:00',
      ratingGiven: 5,
      checkInAudit: {
        checkedAt: '2026-07-20T10:00:00',
        uniform: {
          uniformPresent: true,
          blackShoes: true,
          dutyBelt: true,
          nameBadge: true,
          professionalAppearance: true,
        },
        equipment: { radio: true, flashlight: true, requiredEquipment: true },
        selfieUpload: 'selfie.jpg',
        gpsVerified: true,
      },
    },
  ];
}
