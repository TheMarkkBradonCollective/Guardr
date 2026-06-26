import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Certification } from '../types';
import { staffCanVerifyCertification, staffVerifyCertificationBlocker } from './certImagePolicy.ts';

function cert(overrides: Partial<Certification> = {}): Certification {
  return {
    id: 'c1',
    catalogId: 'bsis-pta-uof-8hr',
    name: 'PTA & UOF',
    issuer: 'BSIS',
    number: 'TR-1',
    issueDate: '2024-01-01',
    status: 'pending',
    imageUrl: 'scan',
    category: 'bsis-training',
    ...overrides,
  };
}

describe('staff credential verification', () => {
  it('allows staff to verify training certificates with document proof', () => {
    const training = cert();
    assert.equal(staffCanVerifyCertification(training), true);
    assert.equal(staffVerifyCertificationBlocker(training), null);
  });

  it('allows staff to verify weapons permits with document proof', () => {
    const permit = cert({
      catalogId: 'bsis-exposed-firearm',
      name: 'BSIS Exposed Firearm Permit',
      category: 'bsis-permit',
      expiryDate: '2099-12-31',
    });
    assert.equal(staffCanVerifyCertification(permit), true);
    assert.equal(staffVerifyCertificationBlocker(permit), null);
  });

  it('blocks verification without a document photo', () => {
    const missingPhoto = cert({ imageUrl: undefined });
    assert.equal(staffCanVerifyCertification(missingPhoto), false);
    assert.match(staffVerifyCertificationBlocker(missingPhoto) ?? '', /document photo required/i);
  });

  it('does not offer verify for already verified credentials', () => {
    const verified = cert({ status: 'verified' });
    assert.equal(staffCanVerifyCertification(verified), false);
    assert.equal(staffVerifyCertificationBlocker(verified), null);
  });
});
