import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SecurityGuard } from '../types';
import {
  getGuardBrowseJobLists,
  guardBrowseTabFromMapFilter,
  mapFilterFromBrowseTab,
} from './guardJobsBrowse';
import type { GuardJobView } from './guardJobView';

function futureIso(hoursFromNow: number): string {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

function pastIso(hoursAgo: number): string {
  return new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();
}

function openJob(id: string, city: string): GuardJobView {
  return {
    id,
    status: 'open',
    state: city,
    startDate: futureIso(24),
    endDate: futureIso(30),
    guardPay: 30,
    durationHours: 6,
    title: `Job ${id}`,
    location: city,
    type: 'event-wedding',
  } as GuardJobView;
}

function acceptedJob(id: string, guardId: string): GuardJobView {
  return {
    id,
    status: 'accepted',
    assignedGuardId: guardId,
    state: 'Los Angeles',
    startDate: futureIso(48),
    endDate: futureIso(54),
    guardPay: 30,
    durationHours: 6,
    title: `Booked ${id}`,
    location: 'Los Angeles',
    type: 'event-wedding',
  } as GuardJobView;
}

function completedJob(id: string, guardId: string): GuardJobView {
  return {
    ...acceptedJob(id, guardId),
    status: 'completed',
    startDate: pastIso(240),
    endDate: pastIso(234),
  };
}

const guard = {
  id: 'g1',
  serviceAreas: ['Los Angeles'],
} as SecurityGuard;

describe('guardJobsBrowse tab sync', () => {
  it('maps browse tabs to map filters', () => {
    assert.equal(mapFilterFromBrowseTab('available'), 'available');
    assert.equal(mapFilterFromBrowseTab('scheduled'), 'upcoming');
    assert.equal(mapFilterFromBrowseTab('completed'), 'all');
    assert.equal(mapFilterFromBrowseTab('missed'), 'all');
  });

  it('maps map filters to browse tabs', () => {
    assert.equal(guardBrowseTabFromMapFilter('available'), 'available');
    assert.equal(guardBrowseTabFromMapFilter('upcoming'), 'scheduled');
    assert.equal(guardBrowseTabFromMapFilter('direct'), 'available');
    assert.equal(guardBrowseTabFromMapFilter('all'), 'available');
  });
});

describe('getGuardBrowseJobLists map vs jobs history', () => {
  it('keeps completed jobs on Jobs history, not map all', () => {
    const jobs = [
      openJob('la', 'Los Angeles'),
      acceptedJob('booked', 'g1'),
      completedJob('done', 'g1'),
    ];
    const lists = getGuardBrowseJobLists(guard, jobs);
    assert.ok(lists.all.every((j) => j.status !== 'completed'));
    assert.equal(lists.completed.some((j) => j.id === 'done'), true);
    assert.equal(lists.scheduled.some((j) => j.id === 'booked'), true);
  });
});
