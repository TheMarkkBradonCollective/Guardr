import assert from 'node:assert/strict';
import test from 'node:test';
import type { GuardCrewJoinRequest, GuardStandingCrewMember, SecurityGuard } from '../types';
import {
  canRequestCrewPlacement,
  declineCrewJoinRequest,
  makeGuardCrewLeadProfile,
  submitCrewJoinRequest,
} from './guardCrewJoinRequest';

function trustedGuard(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'g1',
    name: 'Alex Guard',
    email: 'alex@example.com',
    badgeNumber: '1001',
    avatar: '',
    phone: '',
    bio: '',
    isArmed: false,
    backgroundChecked: true,
    verified: true,
    trusted: true,
    rating: 5,
    jobsCompleted: 10,
    certifications: [],
    experience: [],
    userStatus: 'active',
    ...overrides,
  };
}

test('canRequestCrewPlacement allows trusted guards without a crew', () => {
  const guard = trustedGuard();
  assert.equal(canRequestCrewPlacement(guard, [], []), true);
});

test('canRequestCrewPlacement blocks guards already on a crew', () => {
  const guard = trustedGuard();
  const members: GuardStandingCrewMember[] = [
    {
      id: 'sc-lead-g1',
      leadGuardId: 'lead',
      memberGuardId: 'g1',
      status: 'active',
      invitedAt: new Date().toISOString(),
    },
  ];
  assert.equal(canRequestCrewPlacement(guard, members, []), false);
});

test('canRequestCrewPlacement blocks guards leading a crew', () => {
  const guard = trustedGuard();
  const members: GuardStandingCrewMember[] = [
    {
      id: 'sc-g1-m2',
      leadGuardId: 'g1',
      memberGuardId: 'm2',
      status: 'pending',
      invitedAt: new Date().toISOString(),
    },
  ];
  assert.equal(canRequestCrewPlacement(guard, members, []), false);
});

test('canRequestCrewPlacement blocks guards with a crew profile', () => {
  const guard = trustedGuard({ standingCrewName: 'Night Watch' });
  assert.equal(canRequestCrewPlacement(guard, [], []), false);
});

test('submitCrewJoinRequest creates a pending request', () => {
  const guard = trustedGuard();
  const result = submitCrewJoinRequest([], guard, [], 'Looking for a team');
  assert.ok(!('error' in result));
  if ('error' in result) return;
  assert.equal(result.request.status, 'pending');
  assert.equal(result.request.message, 'Looking for a team');
});

test('makeGuardCrewLeadProfile requires trusted status', () => {
  const result = makeGuardCrewLeadProfile(trustedGuard({ trusted: false }));
  assert.ok('error' in result);
  if (!('error' in result)) return;
  assert.match(result.error, /trusted guard/i);
});

test('makeGuardCrewLeadProfile sets a default crew name', () => {
  const result = makeGuardCrewLeadProfile(trustedGuard());
  assert.ok(!('error' in result));
  if ('error' in result) return;
  assert.equal(result.standingCrewName, "Alex Guard's Crew");
});

test('declineCrewJoinRequest resolves pending requests', () => {
  const requests: GuardCrewJoinRequest[] = [
    {
      id: 'cjr-g1',
      guardId: 'g1',
      status: 'pending',
      requestedAt: new Date().toISOString(),
    },
  ];
  const result = declineCrewJoinRequest(requests, 'cjr-g1', 'staff1');
  assert.ok(!('error' in result));
  if ('error' in result) return;
  assert.equal(result.request.status, 'declined');
  assert.equal(result.request.resolvedByStaffId, 'staff1');
});
