import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveNotificationDestination, remapNotificationUrlForUser } from './notificationRouting';
import type { SessionUser } from '../types';

const guardUser: SessionUser = {
  id: 'g1',
  email: 'guard@test.com',
  role: 'guard',
  name: 'Guard',
};

const clientUser: SessionUser = {
  id: 'c1',
  email: 'client@test.com',
  role: 'client',
  name: 'Client',
};

const staffUser: SessionUser = {
  id: 's1',
  email: 'staff@test.com',
  role: 'administrator',
  name: 'Staff',
};

test('resolveNotificationDestination builds guard assignment deep link from metadata', () => {
  const url = resolveNotificationDestination(
    {
      type: 'assignment',
      requestId: 'job-1',
    },
    guardUser
  );
  assert.equal(url, '/guard/my-jobs?jc=job-1');
});

test('resolveNotificationDestination remaps staff job links for guards', () => {
  const url = resolveNotificationDestination(
    {
      type: 'assignment',
      url: '/staff/jobs?j=job-1',
    },
    guardUser
  );
  assert.equal(url, '/guard/my-jobs?jc=job-1');
});

test('resolveNotificationDestination routes payout_ready to guard earnings', () => {
  const url = resolveNotificationDestination(
    {
      type: 'payout_ready',
    },
    guardUser
  );
  assert.equal(url, '/guard/earnings');
});

test('remapNotificationUrlForUser maps support tickets to the signed-in role', () => {
  assert.equal(
    remapNotificationUrlForUser('/staff/messages?st=ticket-1', clientUser),
    '/client/messages?st=ticket-1'
  );
  assert.equal(
    remapNotificationUrlForUser('/staff/messages?st=ticket-1', guardUser),
    '/guard/messages?st=ticket-1'
  );
});

test('remapNotificationUrlForUser preserves chat intent for job messages', () => {
  assert.equal(
    remapNotificationUrlForUser('/staff/messages?mtab=jobs&jc=job-1&chat=1', guardUser),
    '/guard/my-jobs?jc=job-1&chat=1'
  );
  assert.equal(
    remapNotificationUrlForUser('/guard/my-jobs?jc=job-1&chat=1', clientUser),
    '/client/map?jc=job-1&chat=1'
  );
});
