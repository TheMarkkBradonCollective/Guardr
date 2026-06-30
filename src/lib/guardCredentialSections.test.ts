import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Certification, SecurityGuard } from '../types';
import {
  coiApprovalItemId,
  groupPendingCredentialApprovals,
  isCoiApprovalItemId,
} from './guardCredentialSections.ts';

const guard: SecurityGuard = {
  id: 'g-coi',
  name: 'Test Guard',
  email: 'guard@test.com',
  phone: '',
  hourlyRate: 30,
  certifications: [],
  insurancePolicy: {
    id: 'ins-1',
    guardId: 'g-coi',
    carrier: 'Acme Insurance',
    policyNumber: 'POL-99',
    expiryDate: '2099-12-31',
    status: 'pending',
    documentUrl: 'doc',
  },
};

const cert: Certification = {
  id: 'cert-1',
  catalogId: 'cpr-aed',
  category: 'medical',
  name: 'CPR/AED',
  issuer: 'Red Cross',
  number: '123',
  status: 'pending',
};

describe('groupPendingCredentialApprovals', () => {
  it('places pending COI in the coi section alongside cert sections', () => {
    const sections = groupPendingCredentialApprovals(
      [{ guard, cert }],
      [guard],
      { hideEmpty: true }
    );

    const coiSection = sections.find((section) => section.id === 'coi');
    const medicalSection = sections.find((section) => section.id === 'medical');

    assert.equal(coiSection?.entries.length, 1);
    assert.equal(coiSection?.entries[0]?.kind, 'coi');
    assert.equal(medicalSection?.entries.length, 1);
    assert.equal(medicalSection?.entries[0]?.kind, 'cert');
  });
});

describe('coiApprovalItemId', () => {
  it('uses a stable coi- prefix for queue item ids', () => {
    const itemId = coiApprovalItemId('g-coi');
    assert.equal(itemId, 'coi-g-coi');
    assert.equal(isCoiApprovalItemId(itemId), true);
    assert.equal(isCoiApprovalItemId('cert-1'), false);
  });
});
