import assert from 'node:assert/strict';
import test from 'node:test';
import type { SecurityGuard } from '../types';
import { listGuardContractorComplianceGaps, staffRoleSeparationAllowsManage } from './workforceCompliance';

function minimalGuard(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'g1',
    name: 'Test Guard',
    email: 'guard@test.com',
    badgeNumber: 'G-001',
    backgroundChecked: false,
    isStaff: false,
    ...overrides,
  } as SecurityGuard;
}

test('listGuardContractorComplianceGaps lists missing verification items', () => {
  const gaps = listGuardContractorComplianceGaps(minimalGuard({ backgroundChecked: false }));
  assert.ok(gaps.includes('background_check'));
  assert.ok(gaps.includes('government_id'));
  assert.ok(gaps.includes('active_status'));
});

test('staffRoleSeparationAllowsManage blocks same-tier moderation', () => {
  assert.equal(
    staffRoleSeparationAllowsManage({ role: 'administrator' }, { staffRole: 'Administrator' }),
    false,
  );
  assert.equal(
    staffRoleSeparationAllowsManage({ role: 'director' }, { staffRole: 'Moderator' }),
    true,
  );
  assert.equal(
    staffRoleSeparationAllowsManage({ role: 'manager' }, { staffRole: null, sideRole: 'Finance' }),
    false,
  );
});
