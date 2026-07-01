import test from 'node:test';
import assert from 'node:assert/strict';
import type { GuardStandingCrewMember, SecurityGuard, SecurityRequest } from '../types';
import {
  getBrowsableClientCrews,
  getCrewDisplayName,
  getStandingCrewDisplayName,
} from './guardTeams';

function trustedGuard(overrides: Partial<SecurityGuard> = {}): SecurityGuard {
  return {
    id: 'lead-1',
    name: 'Alex Rivera',
    email: 'alex@test.com',
    badgeNumber: '1001',
    avatar: '',
    phone: '',
    bio: '',
    isArmed: false,
    backgroundChecked: true,
    verified: true,
    rating: 4.8,
    jobsCompleted: 12,
    certifications: [],
    experience: [],
    trusted: true,
    userStatus: 'active',
    ...overrides,
  };
}

function openMultiGuardJob(overrides: Partial<SecurityRequest> = {}): SecurityRequest {
  return {
    id: 'job-1',
    clientId: 'client-1',
    title: 'Event security',
    location: 'Los Angeles, CA',
    siteName: 'Convention Center',
    startDate: '2026-08-01T18:00:00.000Z',
    endDate: '2026-08-01T23:00:00.000Z',
    status: 'open',
    guardsNeeded: 3,
    teamLeadId: 'lead-1',
    armedRequired: false,
    guardSlots: [
      { id: 'job-1-slot-1', slotIndex: 1, guardId: 'lead-1', status: 'crew_confirmed' },
    ],
    applicants: ['lead-1'],
    jobType: 'event',
    requestType: 'marketplace',
    minGuardQualification: 'active',
    createdAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  } as SecurityRequest;
}

test('defaults standing crew display name from guard name', () => {
  assert.equal(getStandingCrewDisplayName(trustedGuard()), "Alex Rivera's crew");
  assert.equal(
    getStandingCrewDisplayName(trustedGuard({ standingCrewName: 'Night Watch Unit' })),
    'Night Watch Unit'
  );
});

test('falls back to standing crew name in job display when job has no custom name', () => {
  assert.equal(
    getCrewDisplayName({ title: 'Event security', crewName: null }, 'Alex Rivera', 'Night Watch Unit'),
    'Night Watch Unit'
  );
});

test('lists trusted standing teams without open jobs', () => {
  const guard = trustedGuard({
    standingCrewName: 'Elite Response',
    standingCrewDescription: 'Corporate and event specialists.',
  });
  const members: GuardStandingCrewMember[] = [
    {
      id: 'm1',
      leadGuardId: 'lead-1',
      memberGuardId: 'member-1',
      status: 'active',
      invitedAt: '2026-07-01T00:00:00.000Z',
    },
  ];
  const listings = getBrowsableClientCrews([], [guard], members);
  assert.equal(listings.length, 1);
  assert.deepEqual(
    {
      listingId: listings[0].listingId,
      kind: listings[0].kind,
      crewName: listings[0].crewName,
      crewDescription: listings[0].crewDescription,
      memberCount: listings[0].memberCount,
    },
    {
      listingId: 'standing:lead-1',
      kind: 'standing',
      crewName: 'Elite Response',
      crewDescription: 'Corporate and event specialists.',
      memberCount: 2,
    }
  );
});

test('prefers open job listing over duplicate standing profile for same coordinator', () => {
  const guard = trustedGuard({ standingCrewName: 'Elite Response' });
  const job = openMultiGuardJob();
  const listings = getBrowsableClientCrews([job], [guard], []);
  assert.equal(listings.length, 1);
  assert.equal(listings[0].kind, 'job');
  assert.equal(listings[0].crewName, 'Elite Response');
});
