import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  browsableSharedLocations,
  ensureSharedJobLocation,
  findMatchingJobLocation,
  findRejectedJobLocation,
  jobLocationBrowseBucket,
  normalizePlaceKey,
  newJobLocationDraft,
} from './jobLocations';
import type { JobLocation, SecurityRequest } from '../types';

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

  it('blocks rejected addresses from reuse', () => {
    const rejected = newJobLocationDraft({
      name: 'Bad site',
      address: '55 Pine Rd',
      state: 'Fresno',
      status: 'rejected',
    });
    assert.equal(findMatchingJobLocation([rejected], '55 Pine Road', 'Fresno'), undefined);
    assert.ok(findRejectedJobLocation([rejected], '55 Pine Road', 'Fresno'));
    assert.throws(
      () =>
        ensureSharedJobLocation([rejected], {
          name: 'Retry',
          address: '55 Pine Road',
          state: 'Fresno',
        }),
      /rejected/i
    );
  });

  it('hides private locations from other clients', () => {
    const privateLoc = newJobLocationDraft({
      name: 'Private HQ',
      address: '9 Secret Way',
      state: 'Oakland',
      status: 'active',
      listed: false,
      createdByClientId: 'owner',
    });
    assert.equal(
      findMatchingJobLocation([privateLoc], '9 Secret Way', 'Oakland', undefined, {
        forClientId: 'other',
      }),
      undefined
    );
    assert.equal(
      findMatchingJobLocation([privateLoc], '9 Secret Way', 'Oakland', undefined, {
        forClientId: 'owner',
      })?.id,
      privateLoc.id
    );
    assert.equal(browsableSharedLocations([privateLoc], 'other').length, 0);
    assert.equal(browsableSharedLocations([privateLoc], 'owner').length, 1);
  });

  it('treats active sites with past-only jobs as archived bucket', () => {
    const loc = newJobLocationDraft({
      name: 'Old venue',
      address: '1 Past St',
      state: 'Sacramento',
      status: 'active',
    });
    const jobs = [
      { id: 'j1', jobLocationId: loc.id, status: 'completed' },
    ] as SecurityRequest[];
    assert.equal(jobLocationBrowseBucket(loc, jobs), 'archived');
    assert.equal(jobLocationBrowseBucket(loc, []), 'active');
  });
});
