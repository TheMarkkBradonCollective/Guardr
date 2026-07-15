import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityGuard } from '../types';
import {
  getClientVisibleListedWeaponGear,
  getEligibleWeaponGear,
  getGuardArmedDisplayLevel,
  guardMeetsWeaponGearRequirements,
  GUARD_WEAPON_GEAR_RULES,
  shouldShowGuardArmedDisplayLevel,
} from './guardWeaponGear.ts';

function guardWithCerts(
  certs: SecurityGuard['certifications'],
  overrides: Partial<SecurityGuard> = {}
): SecurityGuard {
  return {
    id: 'g1',
    certifications: certs,
    listedWeaponGear: [],
    ...overrides,
  } as SecurityGuard;
}

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

describe('GUARD_WEAPON_GEAR_RULES', () => {
  it('defines California BSIS requirements per weapon', () => {
    assert.equal(GUARD_WEAPON_GEAR_RULES.length, 6);
    assert.deepEqual(
      GUARD_WEAPON_GEAR_RULES.find((rule) => rule.id === 'firearm')?.requiredCatalogIds,
      ['bsis-exposed-firearm', 'bsis-firearms-training', 'bsis-firearms-qualification']
    );
  });
});

describe('guard weapon gear eligibility', () => {
  const guardCard = verifiedCert('bsis-guard-card', 'guard-card');

  it('allows handcuffs with verified guard card only', () => {
    const guard = guardWithCerts([guardCard]);
    assert.equal(guardMeetsWeaponGearRequirements(guard, 'handcuffs'), true);
    assert.equal(guardMeetsWeaponGearRequirements(guard, 'flashlight'), true);
  });

  it('requires baton permit and training for baton', () => {
    const guard = guardWithCerts([
      guardCard,
      verifiedCert('bsis-baton', 'bsis-permit'),
      verifiedCert('bsis-baton-training'),
    ]);
    assert.equal(guardMeetsWeaponGearRequirements(guard, 'baton'), true);
    assert.equal(getEligibleWeaponGear(guard).some((rule) => rule.id === 'baton'), true);
  });

  it('shows only listed eligible gear to clients', () => {
    const guard = guardWithCerts(
      [guardCard, verifiedCert('bsis-baton', 'bsis-permit'), verifiedCert('bsis-baton-training')],
      { listedWeaponGear: ['baton', 'handcuffs'] }
    );
    const visible = getClientVisibleListedWeaponGear(guard);
    assert.deepEqual(
      visible.map((rule) => rule.id),
      ['baton', 'handcuffs']
    );
  });
});

describe('guard armed display level', () => {
  const guardCard = verifiedCert('bsis-guard-card', 'guard-card');
  const firearmCerts = [
    guardCard,
    verifiedCert('bsis-exposed-firearm', 'bsis-permit'),
    verifiedCert('bsis-firearms-training'),
    verifiedCert('bsis-firearms-qualification'),
  ];
  const batonCerts = [
    guardCard,
    verifiedCert('bsis-baton', 'bsis-permit'),
    verifiedCert('bsis-baton-training'),
  ];

  it('returns unarmed when only client-approved gear is listed', () => {
    const guard = guardWithCerts([guardCard], {
      listedWeaponGear: ['handcuffs', 'flashlight'],
      verified: true,
    });
    assert.equal(getGuardArmedDisplayLevel(guard), 'unarmed');
  });

  it('returns light-armed when baton is listed and verified', () => {
    const guard = guardWithCerts(batonCerts, {
      listedWeaponGear: ['baton'],
      verified: true,
    });
    assert.equal(getGuardArmedDisplayLevel(guard), 'light-armed');
  });

  it('returns armed when firearm is listed and verified', () => {
    const guard = guardWithCerts(firearmCerts, {
      listedWeaponGear: ['firearm', 'baton'],
      verified: true,
    });
    assert.equal(getGuardArmedDisplayLevel(guard), 'armed');
  });

  it('only shows level when profile is approved with verified guard card', () => {
    const guard = guardWithCerts([guardCard], { verified: false });
    assert.equal(shouldShowGuardArmedDisplayLevel(guard), false);

    const approved = guardWithCerts([guardCard], { verified: true });
    assert.equal(shouldShowGuardArmedDisplayLevel(approved), true);
  });
});
