import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SecurityGuard } from '../types';
import { computeStandingCrewArmedStats } from './guardCrewArmedCoverage';

function verifiedCert(
  catalogId: string,
  category: SecurityGuard['certifications'][number]['category'] = 'bsis-training'
) {
  return {
    id: catalogId,
    catalogId,
    name: catalogId,
    issuer: 'BSIS',
    number: catalogId,
    issueDate: '2024-01-01',
    state: catalogId === 'bsis-guard-card' ? 'CA' : undefined,
    expiryDate: category === 'bsis-permit' ? '2099-12-31' : undefined,
    status: 'verified' as const,
    imageUrl: 'scan',
    category,
  };
}

function baseGuard(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'g1',
    name: 'Test Guard',
    email: 'g@test.com',
    badgeNumber: '1',
    avatar: '',
    phone: '',
    bio: '',
    isArmed: false,
    backgroundChecked: true,
    verified: true,
    rating: 4.5,
    jobsCompleted: 10,
    certifications: [],
    experience: [],
    listedWeaponGear: [],
    ...overrides,
  };
}

describe('computeStandingCrewArmedStats', () => {
  it('counts only the lead when the roster is empty', () => {
    const lead = baseGuard({ id: 'lead' });
    const stats = computeStandingCrewArmedStats(lead, [], [lead]);
    assert.equal(stats.total, 1);
    assert.equal(stats.armedCapablePercent, 0);
    assert.equal(stats.unarmed, 1);
    assert.equal(stats.unarmedPercent, 100);
  });

  it('fills 100% armed for a solo credentialed lead', () => {
    const guardCard = verifiedCert('bsis-guard-card', 'guard-card');
    const lead = baseGuard({
      id: 'lead',
      certifications: [
        guardCard,
        verifiedCert('bsis-exposed-firearm', 'bsis-permit'),
        verifiedCert('bsis-firearms-training'),
        verifiedCert('bsis-firearms-qualification'),
      ],
      listedWeaponGear: ['firearm'],
    });
    const stats = computeStandingCrewArmedStats(lead, [], [lead]);
    assert.equal(stats.total, 1);
    assert.equal(stats.armed, 1);
    assert.equal(stats.armedPercent, 100);
    assert.equal(stats.armedCapablePercent, 100);
  });

  it('reports armed-capable percentage across lead and active members', () => {
    const guardCard = verifiedCert('bsis-guard-card', 'guard-card');
    const lead = baseGuard({
      id: 'lead',
      certifications: [
        guardCard,
        verifiedCert('bsis-baton', 'bsis-permit'),
        verifiedCert('bsis-baton-training'),
      ],
      listedWeaponGear: ['baton'],
    });
    const armedMember = baseGuard({
      id: 'armed',
      certifications: [
        guardCard,
        verifiedCert('bsis-exposed-firearm', 'bsis-permit'),
        verifiedCert('bsis-firearms-training'),
        verifiedCert('bsis-firearms-qualification'),
      ],
      listedWeaponGear: ['firearm'],
    });
    const unarmedMember = baseGuard({ id: 'unarmed', certifications: [guardCard] });
    const guards = [lead, armedMember, unarmedMember];

    const stats = computeStandingCrewArmedStats(
      lead,
      [armedMember.id, unarmedMember.id],
      guards
    );

    assert.equal(stats.total, 3);
    assert.equal(stats.armed, 1);
    assert.equal(stats.lightArmed, 1);
    assert.equal(stats.unarmed, 1);
    assert.equal(stats.armedCapable, 2);
    assert.equal(stats.armedCapablePercent, 67);
  });
});
