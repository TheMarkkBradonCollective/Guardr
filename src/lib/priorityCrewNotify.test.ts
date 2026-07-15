import test from 'node:test';
import assert from 'node:assert/strict';
import type { GuardStandingCrewMember, SecurityGuard } from '../types';
import { findPriorityCrewLeadsForJob } from './priorityCrewNotify';

function trustedLead(id: string, rating = 4.5): SecurityGuard {
  return {
    id,
    name: `Lead ${id}`,
    email: `${id}@test.com`,
    trusted: true,
    rating,
    verified: true,
    userStatus: 'active',
  } as SecurityGuard;
}

function untrustedGuard(id: string): SecurityGuard {
  return {
    id,
    name: `Guard ${id}`,
    email: `${id}@test.com`,
    trusted: false,
    rating: 5,
    verified: true,
    userStatus: 'active',
  } as SecurityGuard;
}

function activeMember(leadId: string, memberId: string): GuardStandingCrewMember {
  return {
    id: `sc-${leadId}-${memberId}`,
    leadGuardId: leadId,
    memberGuardId: memberId,
    status: 'active',
    invitedAt: '2026-01-01T00:00:00.000Z',
  };
}

test('findPriorityCrewLeadsForJob includes trusted leads with crew size >= guards needed', () => {
  const leads = findPriorityCrewLeadsForJob(
    { guardsNeeded: 3 },
    [trustedLead('lead-a', 4), trustedLead('lead-b', 5), untrustedGuard('other')],
    [
      activeMember('lead-a', 'm1'),
      activeMember('lead-a', 'm2'),
      activeMember('lead-b', 'm3'),
    ]
  );

  assert.equal(leads.length, 1);
  assert.equal(leads[0]?.guard.id, 'lead-a');
  assert.equal(leads[0]?.crewSize, 3);
});

test('findPriorityCrewLeadsForJob sorts by crew size then rating', () => {
  const leads = findPriorityCrewLeadsForJob(
    { guardsNeeded: 2 },
    [trustedLead('small', 5), trustedLead('large', 3)],
    [activeMember('small', 's1'), activeMember('large', 'l1'), activeMember('large', 'l2')],
  );

  assert.deepEqual(
    leads.map((l) => l.guard.id),
    ['large', 'small']
  );
});

test('findPriorityCrewLeadsForJob counts lead plus active members only', () => {
  const leads = findPriorityCrewLeadsForJob(
    { guardsNeeded: 2 },
    [trustedLead('lead-a')],
    [
      activeMember('lead-a', 'active-1'),
      {
        id: 'sc-pending',
        leadGuardId: 'lead-a',
        memberGuardId: 'pending-1',
        status: 'pending',
        invitedAt: '2026-01-01T00:00:00.000Z',
      },
    ]
  );

  assert.equal(leads.length, 1);
  assert.equal(leads[0]?.crewSize, 2);
});
