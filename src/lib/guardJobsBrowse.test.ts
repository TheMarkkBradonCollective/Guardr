import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  guardBrowseTabFromMapFilter,
  mapFilterFromBrowseTab,
} from './guardJobsBrowse';

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
