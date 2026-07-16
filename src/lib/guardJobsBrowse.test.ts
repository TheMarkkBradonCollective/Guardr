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

const guard = {
  id: 'g1',
  serviceAreas: ['Los Angeles'],
} as SecurityGuard;

describe('guardJobsBrowse tab sync', () => {
  it('maps browse tabs to map filters', () => {
    assert.equal(mapFilterFromBrowseTab('available'), 'available');
    assert.equal(mapFilterFromBrowseTab('scheduled'), 'upcoming');
    assert.equal(mapFilterFromBrowseTab('completed'), 'complete');
    assert.equal(mapFilterFromBrowseTab('missed'), 'complete');
  });

  it('maps map filters to browse tabs', () => {
    assert.equal(guardBrowseTabFromMapFilter('available'), 'available');
    assert.equal(guardBrowseTabFromMapFilter('upcoming'), 'scheduled');
    assert.equal(guardBrowseTabFromMapFilter('complete'), 'completed');
    assert.equal(guardBrowseTabFromMapFilter('all'), 'available');
  });
});

describe('getGuardBrowseJobLists service areas', () => {
  it('filters available tab by guard service cities but keeps all jobs for map', () => {
    const jobs = [openJob('la', 'Los Angeles'), openJob('sd', 'San Diego')];
    const lists = getGuardBrowseJobLists(guard, jobs);
    assert.equal(lists.all.length, 2);
    assert.equal(lists.available.length, 1);
    assert.equal(lists.available[0]?.id, 'la');
  });
});
