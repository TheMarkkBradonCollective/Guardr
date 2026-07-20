import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getCoiArchiveHistory } from './coiRevisionHistory';
import { getGovIdArchiveHistory } from './govIdRevisionHistory';
import type { GuardInsurancePolicy, SecurityGuard } from '../types';

describe('coiRevisionHistory', () => {
  it('returns prior COI uploads excluding the current on-file document', () => {
    const policy: GuardInsurancePolicy = {
      id: 'ins-1',
      guardId: 'g-1',
      carrier: 'Acme Insurance',
      policyNumber: 'POL-NEW',
      documentUrl: 'https://example.com/new.pdf',
      status: 'verified',
      revisionHistory: [
        {
          id: 'rev-1',
          recordedAt: '2026-01-01T12:00:00.000Z',
          event: 'superseded',
          status: 'verified',
          carrier: 'Acme Insurance',
          policyNumber: 'POL-OLD',
          documentUrl: 'https://example.com/old.pdf',
        },
      ],
    };

    const history = getCoiArchiveHistory(policy);
    assert.equal(history.length, 1);
    assert.equal(history[0]?.number, 'POL-OLD');
    assert.equal(history[0]?.thumbnailUrl, 'https://example.com/old.pdf');
  });
});

describe('govIdRevisionHistory', () => {
  it('returns prior government ID uploads excluding the current on-file photos', () => {
    const guard = {
      id: 'g-1',
      name: 'Test Guard',
      email: 'guard@test.com',
      idVerificationStatus: 'verified',
      idState: 'CA',
      idNumber: 'D9999999',
      idFrontUrl: 'https://example.com/front-new.jpg',
      idBackUrl: 'https://example.com/back-new.jpg',
      idSelfieUrl: 'https://example.com/selfie-new.jpg',
      idRevisionHistory: [
        {
          id: 'rev-1',
          recordedAt: '2026-01-01T12:00:00.000Z',
          event: 'superseded',
          status: 'verified',
          idState: 'CA',
          idNumber: 'D1234567',
          idFrontUrl: 'https://example.com/front-old.jpg',
          idBackUrl: 'https://example.com/back-old.jpg',
          idSelfieUrl: 'https://example.com/selfie-old.jpg',
        },
      ],
    } as SecurityGuard;

    const history = getGovIdArchiveHistory(guard);
    assert.equal(history.length, 1);
    assert.equal(history[0]?.number, 'D1234567');
    assert.equal(history[0]?.images?.length, 3);
  });
});
