import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityRequest } from '../types';
import {
  acceptTeamInvite,
  declineTeamInvite,
  guardHasApprovedTeamSlot,
  inviteGuardToTeamSlot,
  removeInvitedGuardFromTeam,
} from './guardTeamFlow';
import {
  dismissGuardSuggestion,
  pendingGuardSuggestions,
  suggestGuardForJob,
} from './guardSuggestions';
import { mergeJobSlots } from './guardTeams';

function openMultiGuardJob(overrides: Partial<SecurityRequest> = {}): SecurityRequest {
  const job: SecurityRequest = {
    id: 'job-1',
    title: 'Event security',
    description: '',
    clientId: 'client-1',
    clientName: 'Client',
    clientLogo: '',
    location: 'Los Angeles, CA',
    type: 'event',
    armedRequired: false,
    guardsNeeded: 2,
    startDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    endDate: new Date(Date.now() + 56 * 60 * 60 * 1000).toISOString(),
    durationHours: 8,
    hourlyRate: 40,
    estimatedPayout: 320,
    status: 'open',
    assignedGuardId: null,
    openedAt: new Date().toISOString(),
    requiredCertifications: [],
    applicants: ['guard-lead'],
    guardSlots: mergeJobSlots(
      { id: 'job-1', guardsNeeded: 2 },
      [
        {
          id: 'job-1-slot-1',
          jobId: 'job-1',
          slotIndex: 1,
          guardId: 'guard-lead',
          isLead: true,
          status: 'approved',
        },
        {
          id: 'job-1-slot-2',
          jobId: 'job-1',
          slotIndex: 2,
          guardId: null,
          isLead: false,
          status: 'open',
        },
      ]
    ),
    ...overrides,
  };
  return job;
}

describe('guardTeamFlow invite slots', () => {
  it('allows approved roster members to invite into open slots', () => {
    const job = openMultiGuardJob();
    const result = inviteGuardToTeamSlot(job, 'guard-lead', 'guard-2', [], undefined, new Date('2026-09-03T12:00:00Z'));
    assert.ok(!('error' in result));
    if ('error' in result) return;
    const invited = result.slots.find((s) => s.guardId === 'guard-2');
    assert.equal(invited?.status, 'invited');
    assert.equal(invited?.invitedByGuardId, 'guard-lead');
    assert.equal(guardHasApprovedTeamSlot(result.slots, 'guard-lead'), true);
  });

  it('blocks invites from guards who are not approved yet', () => {
    const job = openMultiGuardJob({
      guardSlots: mergeJobSlots(
        { id: 'job-1', guardsNeeded: 2 },
        [
          {
            id: 'job-1-slot-1',
            jobId: 'job-1',
            slotIndex: 1,
            guardId: 'guard-lead',
            isLead: true,
            status: 'pending_client',
          },
          {
            id: 'job-1-slot-2',
            jobId: 'job-1',
            slotIndex: 2,
            guardId: null,
            isLead: false,
            status: 'open',
          },
        ]
      ),
    });
    const result = inviteGuardToTeamSlot(job, 'guard-lead', 'guard-2', []);
    assert.deepEqual(result, { error: 'You must be approved on this job before inviting other guards.' });
  });

  it('accepts invite into pending_client and decline reopens slot', () => {
    const invited = inviteGuardToTeamSlot(openMultiGuardJob(), 'guard-lead', 'guard-2', []);
    assert.ok(!('error' in invited));
    if ('error' in invited) return;
    const accepted = acceptTeamInvite(invited.job, 'guard-2', [], new Date('2026-09-03T12:05:00Z'));
    assert.ok(!('error' in accepted));
    if ('error' in accepted) return;
    assert.equal(accepted.slots.find((s) => s.guardId === 'guard-2')?.status, 'pending_client');

    const declined = declineTeamInvite(invited.job, 'guard-2', new Date('2026-09-03T12:10:00Z'));
    assert.ok(!('error' in declined));
    if ('error' in declined) return;
    assert.equal(declined.slots.find((s) => s.slotIndex === 2)?.status, 'open');
  });

  it('lets inviter remove pending invites they sent', () => {
    const invited = inviteGuardToTeamSlot(openMultiGuardJob(), 'guard-lead', 'guard-2', []);
    assert.ok(!('error' in invited));
    if ('error' in invited) return;
    const removed = removeInvitedGuardFromTeam(invited.job, 'guard-lead', 'guard-2');
    assert.ok(!('error' in removed));
    if ('error' in removed) return;
    assert.equal(removed.slots.find((s) => s.slotIndex === 2)?.guardId, null);
  });
});

describe('guardSuggestions', () => {
  it('creates pending suggestions and supports dismiss', () => {
    const job = openMultiGuardJob();
    const suggested = suggestGuardForJob(job, 'guard-lead', 'guard-3', [], 'Guard Three');
    assert.ok(!('error' in suggested));
    if ('error' in suggested) return;
    assert.equal(pendingGuardSuggestions(suggested.job).length, 1);

    const dismissed = dismissGuardSuggestion(suggested.job, suggested.suggestion.id);
    assert.ok(!('error' in dismissed));
    if ('error' in dismissed) return;
    assert.equal(pendingGuardSuggestions(dismissed.job).length, 0);
  });
});
