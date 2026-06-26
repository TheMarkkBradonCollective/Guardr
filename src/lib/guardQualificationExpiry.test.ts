import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Certification, SecurityGuard } from '../types';
import {
  guardHasCredentialOnFile,
  guardHasExpired32HourBlock,
  guardHasExpiredPtaUofTraining,
  guardMeets32HourBlock,
  guardMeetsPtaUofTraining,
  isCertExpired,
} from './guardQualification';

function cert(partial: Partial<Certification> & Pick<Certification, 'catalogId' | 'expiryDate'>): Certification {
  return {
    id: `cert-${partial.catalogId}`,
    name: partial.name ?? partial.catalogId ?? 'Cert',
    issuer: partial.issuer ?? 'BSIS',
    number: partial.number ?? '123',
    status: partial.status ?? 'pending',
    issueDate: partial.issueDate ?? '2024-01-01',
    expiryDate: partial.expiryDate,
    catalogId: partial.catalogId,
    imageUrl: partial.imageUrl ?? 'https://example.com/doc.jpg',
  };
}

const guardWithCerts = (certifications: Certification[]): SecurityGuard => ({
  id: 'guard-1',
  name: 'Test Guard',
  email: 'guard@example.com',
  badgeNumber: 'GR-1',
  avatar: '',
  phone: '',
  bio: '',
  isArmed: false,
  backgroundChecked: false,
  verified: false,
  rating: 0,
  jobsCompleted: 0,
  certifications,
  experience: [],
  hourlyRateRequirement: 40,
  userStatus: 'pending',
});

describe('pathway credential expiry', () => {
  it('treats expired PTA/UOF combined cert as not on file', () => {
    const guard = guardWithCerts([
      cert({
        catalogId: 'bsis-pta-uof-8hr',
        expiryDate: '2020-01-01',
      }),
    ]);
    assert.equal(isCertExpired(guard.certifications[0]), true);
    assert.equal(guardHasCredentialOnFile(guard, 'bsis-pta-uof-8hr'), false);
    assert.equal(guardMeetsPtaUofTraining(guard), false);
    assert.equal(guardHasExpiredPtaUofTraining(guard), true);
  });

  it('treats expired 32-hour course as not counting toward block', () => {
    const guard = guardWithCerts([
      cert({
        catalogId: 'bsis-communication',
        expiryDate: '2020-01-01',
      }),
    ]);
    assert.equal(guardMeets32HourBlock(guard), false);
    assert.equal(guardHasExpired32HourBlock(guard), true);
  });
});
