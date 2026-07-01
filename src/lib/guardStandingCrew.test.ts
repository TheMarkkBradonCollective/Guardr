import test from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityGuard } from '../types';
import {
  acceptStandingCrewInvite,
  getPendingStandingCrewIncoming,
  inviteToStandingCrew,
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
