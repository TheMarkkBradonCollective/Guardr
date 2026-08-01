import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialTutorialDemoData,
  isTutorialDemoId,
  mergeTutorialRequests,
  stripTutorialRequests,
  TUTORIAL_DEMO_PREFIX,
} from './tutorialDemoData.ts';
import type { SecurityRequest } from '../types.ts';

const USER = 'user-demo-1';

function liveRequest(id: string): SecurityRequest {
  return {
    id,
    title: 'Live job',
    description: '',
    clientId: 'client-1',
    clientName: 'Client',
    clientLogo: '',
    location: 'Site',
    siteName: 'Site',
    address: '1 Main St',
    state: 'CA',
    latitude: 0,
    longitude: 0,
    type: 'event',
    armedRequired: false,
    guardsNeeded: 1,
    startDate: new Date().toISOString(),
    endDate: new Date().toISOString(),
    durationHours: 8,
    hourlyRate: 40,
    estimatedPayout: 320,
    status: 'open',
    assignedGuardId: null,
    applicants: [],
    requiredCertifications: [],
    paymentStatus: 'paid',
  };
}

describe('tutorialDemoData', () => {
  it('identifies tutorial demo ids', () => {
    assert.equal(isTutorialDemoId(`${TUTORIAL_DEMO_PREFIX}guard-job`), true);
    assert.equal(isTutorialDemoId('real-job-1'), false);
  });

  it('creates role-specific initial demo data', () => {
    const guard = createInitialTutorialDemoData('guard', USER);
    const client = createInitialTutorialDemoData('client', USER);
    const staff = createInitialTutorialDemoData('staff', USER);
    assert.equal(guard.requests.length, 1);
    assert.equal(client.requests.length, 1);
    assert.equal(staff.requests.length, 1);
    assert.ok(isTutorialDemoId(guard.requests[0].id));
  });

  it('merges demo requests ahead of live data', () => {
    const demo = createInitialTutorialDemoData('guard', USER).requests;
    const live = [liveRequest('live-1')];
    const merged = mergeTutorialRequests(live, demo);
    assert.equal(merged.length, 2);
    assert.ok(isTutorialDemoId(merged[0].id));
    assert.equal(merged[1].id, 'live-1');
  });

  it('strips tutorial requests', () => {
    const demo = createInitialTutorialDemoData('guard', USER).requests;
    const live = [liveRequest('live-1')];
    const merged = mergeTutorialRequests(live, demo);
    const stripped = stripTutorialRequests(merged);
    assert.equal(stripped.length, 1);
    assert.equal(stripped[0].id, 'live-1');
  });
});
