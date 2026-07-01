import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityRequest } from '../types';
import {
  hasJobCoordinates,
  isJobLocationCoordsMissing,
  jobMapCoordsApprovalBlocker,
  jobMayPublishToMarketplace,
} from './jobLocation';

function job(overrides: Partial<SecurityRequest> = {}): SecurityRequest {
  return {
    id: 'req-1',
    title: 'Test job',
    clientId: 'c1',
    clientName: 'Client',
    location: '123 Main St',
    status: 'pending-review',
    ...overrides,
  } as SecurityRequest;
}

describe('job map coordinates', () => {
  it('detects missing coordinates', () => {
    assert.equal(hasJobCoordinates(job()), false);
    assert.equal(isJobLocationCoordsMissing(job()), true);
    assert.ok(jobMapCoordsApprovalBlocker(job()));
  });

  it('allows approval when coordinates are present', () => {
    const withCoords = job({ latitude: 34.05, longitude: -118.24 });
    assert.equal(hasJobCoordinates(withCoords), true);
    assert.equal(jobMapCoordsApprovalBlocker(withCoords), null);
    assert.equal(jobMayPublishToMarketplace(withCoords), true);
  });

  it('blocks marketplace publish without coordinates', () => {
    assert.equal(jobMayPublishToMarketplace(job({ status: 'open' })), false);
  });
});
