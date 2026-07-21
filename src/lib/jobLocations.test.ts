import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ensureSharedJobLocation,
  findMatchingJobLocation,
  normalizePlaceKey,
  newJobLocationDraft,
} from './jobLocations';
import type { JobLocation } from '../types';

describe('job location reuse', () => {
  it('normalizes street suffixes for place keys', () => {
    assert.equal(
      normalizePlaceKey('100 Main Street', 'Los Angeles'),
      normalizePlaceKey('100 Main St', 'Los Angeles')
    );
  });

  it('reuses an existing shared location for the same place', () => {
    const first = newJobLocationDraft({
      name: 'Warehouse A',
      address: '100 Main Street',
      state: 'Los Angeles',
      createdByClientId: 'client-a',
      status: 'active',
    });
    const locations: JobLocation[] = [first];

    const result = ensureSharedJobLocation(locations, {
      name: 'Main Warehouse',
      address: '100 Main St',
      state: 'Los Angeles',
      createdByClientId: 'client-b',
      preferredStatus: 'active',
    });

    assert.equal(result.created, false);
    assert.equal(result.location.id, first.id);
    assert.equal(result.locations.length, 1);
    assert.equal(result.location.createdByClientId, 'client-a');
  });

  it('creates a new location when the address differs', () => {
    const existing = newJobLocationDraft({
      name: 'Site One',
      address: '10 Oak Ave',
      state: 'San Diego',
      status: 'active',
    });
    const result = ensureSharedJobLocation([existing], {
      name: 'Site Two',
      address: '20 Oak Ave',
      state: 'San Diego',
    });
    assert.equal(result.created, true);
    assert.notEqual(result.location.id, existing.id);
    assert.equal(result.locations.length, 2);
  });

  it('findMatchingJobLocation ignores rejected places', () => {
    const rejected = newJobLocationDraft({
      name: 'Bad site',
      address: '55 Pine Rd',
      state: 'Fresno',
      status: 'rejected',
    });
    assert.equal(findMatchingJobLocation([rejected], '55 Pine Road', 'Fresno'), undefined);
  });
});
