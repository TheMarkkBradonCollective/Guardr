import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SecurityGuard } from '../types';
import { CREDENTIAL_NOT_LISTED_OR_ON_FILE_LABEL } from './certStatus.ts';
import {
  getCoiSectionStatus,
  getGovernmentIdSectionStatus,
  getGuardCardSectionStatus,
  getPtaUofSectionStatus,
  getThirtyTwoHourSectionStatus,
} from './credentialSectionStatus.ts';

function baseGuard(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'g-1',
    name: 'Test Guard',
    email: 'guard@test.com',
    certifications: [],
    ...overrides,
  } as SecurityGuard;
}

describe('credential section status tones', () => {
  it('uses warning tone for not listed or on file section badges', () => {
    const guard = baseGuard();
    assert.equal(getGuardCardSectionStatus(guard).label, CREDENTIAL_NOT_LISTED_OR_ON_FILE_LABEL);
    assert.equal(getGuardCardSectionStatus(guard).tone, 'warning');
    assert.equal(getPtaUofSectionStatus(guard).label, CREDENTIAL_NOT_LISTED_OR_ON_FILE_LABEL);
    assert.equal(getPtaUofSectionStatus(guard).tone, 'warning');
    assert.equal(getThirtyTwoHourSectionStatus(guard).label, CREDENTIAL_NOT_LISTED_OR_ON_FILE_LABEL);
    assert.equal(getThirtyTwoHourSectionStatus(guard).tone, 'warning');
  });

  it('normalizes government ID not on file to the shared not-listed label', () => {
    const guard = baseGuard();
    const status = getGovernmentIdSectionStatus(guard);
    assert.equal(status.label, CREDENTIAL_NOT_LISTED_OR_ON_FILE_LABEL);
    assert.equal(status.tone, 'warning');
    assert.equal(getCoiSectionStatus(guard).label, CREDENTIAL_NOT_LISTED_OR_ON_FILE_LABEL);
  });
});
