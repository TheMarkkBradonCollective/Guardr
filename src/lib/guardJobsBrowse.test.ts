import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SecurityGuard } from '../types';
import {
  getGuardBrowseJobLists,
  guardBrowseTabFromMapFilter,
  mapFilterFromBrowseTab,
} from './guardJobsBrowse';
import type { GuardJobView } from './guardJobView';

function openJob(id: string, city: string): GuardJobView {
  return {
    id,
    status: 'open',
    state: city,
    startDate: '2026-07-21T10:00:00',
    endDate: '2026-07-21T16:00:00',
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
    startDate: '2026-07-22T10:00:00',
    endDate: '2026-07-22T16:00:00',
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
    startDate: '2026-07-10T10:00:00',
    endDate: '2026-07-10T16:00:00',
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
