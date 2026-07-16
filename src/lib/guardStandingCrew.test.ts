import test from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityGuard } from '../types';
import {
  acceptStandingCrewInvite,
  dissolveStandingCrewForUntrustedGuard,
  getPendingStandingCrewIncoming,
  inviteToStandingCrew,
  shouldOfferTeamCodeJoin,
} from './guardStandingCrew';

function trustedLead(): SecurityGuard {
  return {
    id: 'lead-1',
    name: 'Lead Guard',
    email: 'lead@test.com',
    trusted: true,
    userStatus: 'active',
    verified: true,
  } as SecurityGuard;
}

test('inviteToStandingCrew creates pending member', () => {
  const result = inviteToStandingCrew([], trustedLead(), 'member-1');
  assert.ok(!('error' in result));
  if ('error' in result) return;
  assert.equal(result.invite.status, 'pending');
  assert.equal(result.members.length, 1);
});

test('acceptStandingCrewInvite activates pending row', () => {
  const invited = inviteToStandingCrew([], trustedLead(), 'member-1');
  assert.ok(!('error' in invited));
  if ('error' in invited) return;
  const accepted = acceptStandingCrewInvite(invited.members, 'member-1', invited.invite.id);
  assert.ok(!('error' in accepted));
  if ('error' in accepted) return;
  assert.equal(accepted.invite?.status, 'active');
});

test('getPendingStandingCrewIncoming lists invites for member', () => {
  const invited = inviteToStandingCrew([], trustedLead(), 'member-1');
  assert.ok(!('error' in invited));
  if ('error' in invited) return;
  const pending = getPendingStandingCrewIncoming(invited.members, 'member-1');
  assert.equal(pending.length, 1);
});

test('inviteToStandingCrew rejects guards already on another standing crew', () => {
  const members = [
    {
      id: 'sc-other-g2',
      leadGuardId: 'other-lead',
      memberGuardId: 'guard-2',
      status: 'active' as const,
      invitedAt: new Date().toISOString(),
    },
  ];
  const result = inviteToStandingCrew(members, trustedLead(), 'guard-2');
  assert.ok('error' in result);
  if (!('error' in result)) return;
  assert.match(result.error, /another standing crew/i);
});

test('acceptStandingCrewInvite rejects when already on another crew', () => {
  const invited = inviteToStandingCrew([], trustedLead(), 'member-1');
  assert.ok(!('error' in invited));
  if ('error' in invited) return;
  const withOtherCrew = [
    ...invited.members,
    {
      id: 'sc-other-member-1',
      leadGuardId: 'other-lead',
      memberGuardId: 'member-1',
      status: 'active' as const,
      invitedAt: new Date().toISOString(),
    },
  ];
  const accepted = acceptStandingCrewInvite(withOtherCrew, 'member-1', invited.invite.id);
  assert.ok('error' in accepted);
  if (!('error' in accepted)) return;
  assert.match(accepted.error, /one standing crew/i);
});

test('shouldOfferTeamCodeJoin allows trusted guards without their own crew', () => {
  const member = {
    id: 'guard-2',
    name: 'Member',
    email: 'member@test.com',
    userStatus: 'active',
    verified: true,
  } as SecurityGuard;

  assert.equal(shouldOfferTeamCodeJoin(trustedLead(), []), true);
  assert.equal(shouldOfferTeamCodeJoin(member, []), true);

  const leadWithCrew = { ...trustedLead(), standingCrewName: 'Lead Crew' } as SecurityGuard;
  assert.equal(shouldOfferTeamCodeJoin(leadWithCrew, []), false);

  const invited = inviteToStandingCrew([], trustedLead(), 'guard-2');
  assert.ok(!('error' in invited));
  if ('error' in invited) return;
  assert.equal(shouldOfferTeamCodeJoin(member, invited.members), false);

  const accepted = acceptStandingCrewInvite(invited.members, 'guard-2', invited.invite.id);
  assert.ok(!('error' in accepted));
  if ('error' in accepted) return;
  assert.equal(shouldOfferTeamCodeJoin(member, accepted.members), false);
});

test('dissolveStandingCrewForUntrustedGuard frees roster members and removes lead ties', () => {
  const invited = inviteToStandingCrew([], trustedLead(), 'member-1');
  assert.ok(!('error' in invited));
  if ('error' in invited) return;
  const accepted = acceptStandingCrewInvite(invited.members, 'member-1', invited.invite.id);
  assert.ok(!('error' in accepted));
  if ('error' in accepted) return;

  const dissolved = dissolveStandingCrewForUntrustedGuard(accepted.members, 'lead-1');
  assert.deepEqual(dissolved.freedMemberIds, ['member-1']);
  assert.equal(dissolved.updatedRows.length, 1);
  assert.equal(dissolved.updatedRows[0]?.status, 'removed');
  assert.equal(
    dissolved.members.filter((m) => m.status === 'active' || m.status === 'pending').length,
    0
  );
});
