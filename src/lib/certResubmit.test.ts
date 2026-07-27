import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SecurityGuard } from '../types';
import {
  certsForCatalogId,
  findRejectedCertForCatalog,
  guardHasRejectedCertForCatalog,
} from './certResubmit';

describe('certResubmit', () => {
  const guard = {
    id: 'g-1',
    certifications: [
      {
        id: 'cert-1',
        catalogId: 'bsis-observation-documentation',
        name: 'Observation and Documentation',
        issuer: 'Valley Guard Online Training',
        number: '30027-115-1618',
        status: 'rejected',
        issueDate: '2024-01-01',
      },
      {
        id: 'cert-2',
        catalogId: 'bsis-guard-card',
        name: 'BSIS Guard Card',
        issuer: 'BSIS',
        number: 'GC-1',
        status: 'pending',
        issueDate: '2024-01-01',
        imageUrl: 'card.jpg',
      },
    ],
  } as SecurityGuard;

  it('finds rejected credentials by catalog id', () => {
    const rejected = findRejectedCertForCatalog(guard, 'bsis-observation-documentation');
    assert.equal(rejected?.id, 'cert-1');
    assert.equal(guardHasRejectedCertForCatalog(guard, 'bsis-observation-documentation'), true);
    assert.equal(guardHasRejectedCertForCatalog(guard, 'bsis-guard-card'), false);
  });

  it('includes rejected credentials in catalog listings', () => {
    const listed = certsForCatalogId(guard, 'bsis-observation-documentation');
    assert.equal(listed.length, 1);
    assert.equal(listed[0]?.status, 'rejected');
  });
});
