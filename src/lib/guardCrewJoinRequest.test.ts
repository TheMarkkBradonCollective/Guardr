import assert from 'node:assert/strict';
import test from 'node:test';
import type { GuardCrewJoinRequest, GuardStandingCrewMember, SecurityGuard } from '../types';
import {
  canRequestCrewLead,
  declineCrewLeadRequest,
  getActionableCrewLeadRequests,
  makeGuardCrewLeadProfile,
  shouldShowPendingCrewLeadRequest,
  submitCrewLeadRequest,
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

test('canRequestCrewLead allows trusted guards without their own crew', () => {
  const guard = trustedGuard();
  assert.equal(canRequestCrewLead(guard, [], []), true);
});

test('canRequestCrewLead blocks guards already on another crew', () => {
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
  assert.equal(canRequestCrewLead(guard, members, []), false);
});

test('canRequestCrewLead blocks guards who already lead a crew', () => {
  const guard = trustedGuard({ standingCrewName: 'Night Watch' });
  assert.equal(canRequestCrewLead(guard, [], []), false);
});

test('submitCrewLeadRequest creates a pending request', () => {
  const guard = trustedGuard();
  const result = submitCrewLeadRequest([], guard, [], 'Ready to coordinate');
  assert.ok(!('error' in result));
  if ('error' in result) return;
  assert.equal(result.request.status, 'pending');
  assert.equal(result.request.message, 'Ready to coordinate');
});

test('makeGuardCrewLeadProfile blocks guards on another standing crew', () => {
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
  const result = makeGuardCrewLeadProfile(guard, members);
  assert.ok('error' in result);
  if (!('error' in result)) return;
  assert.match(result.error, /leave your current standing crew/i);
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

test('declineCrewLeadRequest resolves pending requests', () => {
  const requests: GuardCrewJoinRequest[] = [
    {
      id: 'clr-g1',
      guardId: 'g1',
      status: 'pending',
      requestedAt: new Date().toISOString(),
    },
  ];
  const result = declineCrewLeadRequest(requests, 'clr-g1', 'staff1');
  assert.ok(!('error' in result));
  if ('error' in result) return;
  assert.equal(result.request.status, 'declined');
  assert.equal(result.request.resolvedByStaffId, 'staff1');
});

test('getActionableCrewLeadRequests hides requests for guards who already lead', () => {
  const guard = trustedGuard({ standingCrewName: 'Night Watch' });
  const requests: GuardCrewJoinRequest[] = [
    {
      id: 'clr-g1',
      guardId: 'g1',
      status: 'pending',
      requestedAt: new Date().toISOString(),
    },
  ];
  assert.equal(getActionableCrewLeadRequests(requests, [guard], []).length, 0);
});

test('shouldShowPendingCrewLeadRequest hides stale requests for existing crew leads', () => {
  const guard = trustedGuard({ standingCrewName: 'Night Watch' });
  const requests: GuardCrewJoinRequest[] = [
    {
      id: 'clr-g1',
      guardId: 'g1',
      status: 'pending',
      requestedAt: new Date().toISOString(),
    },
  ];
  assert.equal(shouldShowPendingCrewLeadRequest(guard, [], requests), false);
});

test('makeGuardCrewLeadProfile is idempotent for guards who already lead', () => {
  const guard = trustedGuard({ standingCrewName: 'Night Watch', standingCrewDescription: 'Elite' });
  const result = makeGuardCrewLeadProfile(guard, []);
  assert.ok(!('error' in result));
  if ('error' in result) return;
  assert.equal(result.standingCrewName, 'Night Watch');
  assert.equal(result.standingCrewDescription, 'Elite');
});
