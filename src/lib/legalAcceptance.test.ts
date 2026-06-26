import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLegalComplianceReport,
  hasAcceptedLegalDocument,
  indexLegalAcceptances,
  legalAcceptanceKey,
  missingLegalDocuments,
  resolveLegalAcceptanceUserId,
} from './legalAcceptance';
import type { Client, SecurityGuard, SessionUser } from '../types';

const guardUser: SessionUser = {
  id: 'session-guard-1',
  name: 'Test Guard',
  email: 'guard@example.com',
  role: 'guard',
  badgeNumber: 'GR-1',
  avatar: '',
  hourlyRate: 40,
};

const guards: SecurityGuard[] = [
  {
    id: 'guard-row-1',
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
    certifications: [],
    experience: [],
    hourlyRateRequirement: 40,
    userStatus: 'pending',
  },
];

const clients: Client[] = [
  {
    id: 'client-1',
    name: 'Client One',
    email: 'client@example.com',
    companyName: 'Acme',
    phone: '',
    avatar: '',
    totalRequests: 0,
    approved: true,
    accountStatus: 'active',
  },
];

describe('legalAcceptance', () => {
  it('resolves guard profile id from email when session id differs', () => {
    assert.equal(resolveLegalAcceptanceUserId(guardUser, guards, clients), 'guard-row-1');
  });

  it('treats any accepted document version as satisfied', () => {
    const accepted = indexLegalAcceptances([
      {
        id: '1',
        userId: 'guard-row-1',
        userRole: 'guard',
        documentId: 'terms',
        documentVersion: '2026-06-22',
        acceptedAt: '2026-06-22T00:00:00.000Z',
      },
      {
        id: '2',
        userId: 'guard-row-1',
        userRole: 'guard',
        documentId: 'privacy',
        documentVersion: '2026-06-22',
        acceptedAt: '2026-06-22T00:00:00.000Z',
      },
      {
        id: '3',
        userId: 'guard-row-1',
        userRole: 'guard',
        documentId: 'ica',
        documentVersion: '2026-06-22',
        acceptedAt: '2026-06-22T00:00:00.000Z',
      },
      {
        id: '4',
        userId: 'guard-row-1',
        userRole: 'guard',
        documentId: 'guard-conduct',
        documentVersion: '2026-06-22',
        acceptedAt: '2026-06-22T00:00:00.000Z',
      },
    ]);

    assert.deepEqual(
      missingLegalDocuments('guard', ['session-guard-1', 'guard-row-1'], accepted),
      []
    );
    assert.equal(hasAcceptedLegalDocument(['guard-row-1'], 'terms', accepted), true);
    assert.equal(legalAcceptanceKey('guard-row-1', 'terms', '2026-06-22'), 'guard-row-1:terms:2026-06-22');
  });

  it('builds compliance report with missing users first', () => {
    const report = buildLegalComplianceReport(guards, clients, [
      {
        id: '1',
        userId: 'client-1',
        userRole: 'client',
        documentId: 'terms',
        documentVersion: '2026-06-22',
        acceptedAt: '2026-06-22T00:00:00.000Z',
      },
    ]);
    const incomplete = report.filter((row) => !row.complete);
    assert.equal(incomplete.some((row) => row.userId === 'guard-row-1'), true);
    assert.equal(incomplete.some((row) => row.userId === 'client-1'), true);
  });
});
