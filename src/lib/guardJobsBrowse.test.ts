import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  guardBrowseTabFromMapFilter,
  mapFilterFromBrowseTab,
} from './guardJobsBrowse';

describe('guardJobsBrowse tab sync', () => {
  it('maps browse tabs to map filters', () => {
    assert.equal(mapFilterFromBrowseTab('available'), 'available');
    assert.equal(mapFilterFromBrowseTab('upcoming'), 'upcoming');
    assert.equal(mapFilterFromBrowseTab('past'), 'complete');
  });

  it('maps map filters to browse tabs', () => {
    assert.equal(guardBrowseTabFromMapFilter('available'), 'available');
    assert.equal(guardBrowseTabFromMapFilter('upcoming'), 'upcoming');
    assert.equal(guardBrowseTabFromMapFilter('complete'), 'past');
    assert.equal(guardBrowseTabFromMapFilter('all'), 'available');
  });
});
