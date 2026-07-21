import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SecurityGuard } from '../types';
import { buildStaffGuardStatRows } from './staffStats';
import {
  buildStaffGuardEligibilityRecommendations,
  isCrewLeadEligible,
  isStaffCrewLeadCandidate,
  isTrustedEligible,
  listGuardsEligibleForStaffCrewCreation,
  staffMakeCrewLeadBlocker,
} from './staffGuardEligibility';

function guard(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'g1',
    name: 'Test Guard',
    email: 'guard@test.com',
    badgeNumber: 'G1',
    avatar: '',
    phone: '',
    bio: '',
    isArmed: false,
    jobsCompleted: 12,
    userStatus: 'active',
    verified: true,
    isStaff: false,
    ...overrides,
  } as SecurityGuard;
}

describe('staffGuardEligibility', () => {
  it('recommends trusted status for professional-tier guards with clean records', () => {
    const guards = [guard()];
    const [row] = buildStaffGuardStatRows(guards, []);
    const boosted = { ...row, overallRating: 80, tier: { ...row.tier, id: 'professional', name: 'Professional', level: 2, threshold: 75 } };
    assert.equal(isTrustedEligible(guards[0], boosted), true);

    const recs = buildStaffGuardEligibilityRecommendations(guards, [boosted]);
    assert.equal(recs.length, 1);
    assert.equal(recs[0].kind, 'trusted');
  });

  it('does not recommend trusted when guard is already trusted or below professional tier', () => {
    const guards = [guard({ trusted: true })];
    const [row] = buildStaffGuardStatRows(guards, []);
    const elite = { ...row, overallRating: 90, tier: { ...row.tier, id: 'elite', name: 'Elite', level: 3, threshold: 85 } };
    assert.equal(isTrustedEligible(guards[0], elite), false);

    const low = { ...row, overallRating: 70, tier: { ...row.tier, id: 'rising', name: 'Rising', level: 1, threshold: 60 } };
    assert.equal(isTrustedEligible(guard(), low), false);
  });

  it('recommends crew lead for trusted elite guards without an existing crew', () => {
    const guards = [guard({ trusted: true })];
    const [row] = buildStaffGuardStatRows(guards, []);
    const elite = { ...row, overallRating: 88, tier: { ...row.tier, id: 'elite', name: 'Elite', level: 3, threshold: 85 } };
    assert.equal(isCrewLeadEligible(guards[0], elite, [], []), true);

    const recs = buildStaffGuardEligibilityRecommendations(guards, [elite]);
    assert.equal(recs.length, 1);
    assert.equal(recs[0].kind, 'crew-lead');
  });

  it('excludes crew lead when guard already leads a standing crew', () => {
    const guards = [guard({ trusted: true, standingCrewName: 'Alpha Crew' })];
    const [row] = buildStaffGuardStatRows(guards, []);
    const elite = { ...row, overallRating: 90, tier: { ...row.tier, id: 'elite', name: 'Elite', level: 3, threshold: 85 } };
    assert.equal(isCrewLeadEligible(guards[0], elite, [], []), false);
  });

  it('lists trusted guards who are not already on a crew for staff crew creation', () => {
    const eligible = guard({ id: 'g1', trusted: true, name: 'Alpha Guard' });
    const alreadyLead = guard({ id: 'g2', trusted: true, standingCrewName: 'Beta Crew' });
    const member = guard({ id: 'g3', trusted: true, name: 'Charlie Guard' });
    const untrusted = guard({ id: 'g4', trusted: false, name: 'Delta Guard' });
    const members = [
      {
        id: 'm1',
        leadGuardId: 'lead-1',
        memberGuardId: 'g3',
        status: 'active' as const,
        invitedAt: '2026-01-01T00:00:00.000Z',
      },
    ];

    assert.equal(isStaffCrewLeadCandidate(eligible, members), true);
    assert.equal(isStaffCrewLeadCandidate(alreadyLead, members), false);
    assert.equal(isStaffCrewLeadCandidate(member, members), false);
    assert.equal(isStaffCrewLeadCandidate(untrusted, members), false);

    const listed = listGuardsEligibleForStaffCrewCreation(
      [eligible, alreadyLead, member, untrusted],
      members,
      'alpha',
    );
    assert.deepEqual(listed.map((g) => g.id), ['g1']);
  });

  it('explains make-crew-lead blockers for inactive and untrusted guards', () => {
    assert.match(
      staffMakeCrewLeadBlocker(guard({ userStatus: 'approved', trusted: false }), []) ?? '',
      /approved and active/i
    );
    assert.match(
      staffMakeCrewLeadBlocker(guard({ trusted: false }), []) ?? '',
      /mark as trusted/i
    );
    assert.equal(staffMakeCrewLeadBlocker(guard({ trusted: true }), []), null);
  });
});
