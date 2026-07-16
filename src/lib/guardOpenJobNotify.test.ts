import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityGuard } from '../types';
import { guardJobInServiceArea, guardShouldNotifyForOpenJob } from './guardOpenJobNotify';
import { defaultAvailabilitySchedule } from './guardAvailability';

const laGuard = {
  id: 'g1',
  serviceAreas: ['Los Angeles'],
  jobTypePreferences: ['event-wedding'],
} as SecurityGuard;

const job = {
  type: 'event-wedding' as const,
  state: 'Los Angeles',
  startDate: '2026-07-21T10:00:00',
  endDate: '2026-07-21T16:00:00',
};

describe('guardJobInServiceArea', () => {
  it('matches when job city is in service areas', () => {
    assert.equal(guardJobInServiceArea(laGuard, job), true);
    assert.equal(guardJobInServiceArea(laGuard, { state: 'San Diego' }), false);
  });
});

describe('guardShouldNotifyForOpenJob', () => {
  it('requires preferences, service area, and availability', () => {
    const schedule = defaultAvailabilitySchedule('g1');
    assert.equal(guardShouldNotifyForOpenJob(laGuard, job, schedule), true);
    assert.equal(
      guardShouldNotifyForOpenJob(
        { ...laGuard, jobTypePreferences: ['patrol'] },
        job,
        schedule
      ),
      false
    );
    assert.equal(
      guardShouldNotifyForOpenJob(laGuard, { ...job, state: 'San Diego' }, schedule),
      false
    );
  });
});
