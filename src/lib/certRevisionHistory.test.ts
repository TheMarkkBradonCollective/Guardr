import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Certification } from '../types';
import {
  certHasPendingUpdate,
  certUpdateSubmissionAllowed,
  getCertificationRevisionTimeline,
  pendingUpdateFromPayload,
} from './certRevisionHistory';

function baseCert(overrides: Partial<Certification> = {}): Certification {
  return {
    id: 'cert-1',
    name: 'BSIS Guard Card',
    issuer: 'BSIS',
    number: 'GC-1',
    status: 'verified',
    issueDate: '2024-01-01',
    imageUrl: 'https://example.com/card.jpg',
    ...overrides,
  };
}

describe('certRevisionHistory', () => {
  it('allows guard submission after staff requests an update', () => {
    const cert = baseCert({ updateRequestedAt: '2026-01-01T00:00:00.000Z' });
    assert.equal(certUpdateSubmissionAllowed(cert), true);
  });

  it('builds newest-first timeline with pending update above current on file', () => {
    const cert = baseCert({
      pendingUpdate: pendingUpdateFromPayload({
        issuer: 'BSIS',
        number: 'GC-2',
        imageUrl: 'https://example.com/card-new.jpg',
      }),
    });
    const timeline = getCertificationRevisionTimeline(cert);
    assert.equal(timeline[0]?.label, 'Update submitted');
    assert.equal(timeline[1]?.label, 'Current on file');
    assert.equal(certHasPendingUpdate(cert), true);
  });
});
