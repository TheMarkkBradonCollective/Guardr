import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { rolesForNotificationType, resolveNotificationUrl, resolveNotificationUrlForRole } from './routing.ts';
import { missedCheckinDedupKey } from './dedup.ts';
import { isStaffSession } from './eventAuth.ts';

describe('rolesForNotificationType', () => {
  it('includes clients in emergency alerts', () => {
    assert.deepEqual(rolesForNotificationType('emergency_alert'), [
      'guard',
      'client',
      'dispatch',
      'admin',
    ]);
  });

  it('routes assignments to guards by default', () => {
    assert.deepEqual(rolesForNotificationType('assignment'), ['guard']);
  });

  it('routes staff operational alerts to dispatch', () => {
    assert.deepEqual(rolesForNotificationType('payment_attention'), ['dispatch', 'admin']);
  });

  it('routes dispute updates to all parties by default', () => {
    assert.deepEqual(rolesForNotificationType('dispute_update'), [
      'dispatch',
      'admin',
      'client',
      'guard',
    ]);
  });
});

describe('resolveNotificationUrlForRole', () => {
  it('deep-links clients to their job map on emergencies', () => {
    const url = resolveNotificationUrlForRole('emergency_alert', 'client', { requestId: 'job-1' });
    assert.equal(url, '/client/map?jc=job-1');
  });

  it('deep-links clients to job requests on assignments', () => {
    const url = resolveNotificationUrlForRole('assignment', 'client', { requestId: 'job-1' });
    assert.equal(url, '/client/requests?jc=job-1');
  });

  it('deep-links clients to job requests on guard applications', () => {
    const url = resolveNotificationUrlForRole('guard_application', 'client', { requestId: 'job-1' });
    assert.equal(url, '/client/requests?jc=job-1');
  });

  it('deep-links guards to active job on emergencies', () => {
    const url = resolveNotificationUrlForRole('emergency_alert', 'guard', { requestId: 'job-1' });
    assert.equal(url, '/guard/my-jobs?jc=job-1');
  });

  it('deep-links guards to map job on open-to-guards alerts', () => {
    const url = resolveNotificationUrlForRole('job_open_to_guards', 'guard', { requestId: 'job-1' });
    assert.equal(url, '/guard/map?jc=job-1');
  });

  it('deep-links staff to applications tab for guard applications', () => {
    const url = resolveNotificationUrlForRole('guard_application', 'administrator', { requestId: 'job-1' });
    assert.equal(url, '/staff/applications?j=job-1');
  });

  it('deep-links staff to guards tab for pending guard accounts', () => {
    const url = resolveNotificationUrl('guard_pending_approval', { guardId: 'guard-1' });
    assert.equal(url, '/staff/guards?g=guard-1');
  });

  it('deep-links guards to earnings on payout_ready', () => {
    const url = resolveNotificationUrlForRole('payout_ready', 'guard');
    assert.equal(url, '/guard/earnings');
  });

  it('deep-links job status updates to the correct role shell', () => {
    assert.equal(
      resolveNotificationUrlForRole('job_status_update', 'client', { requestId: 'job-1' }),
      '/client/requests?jc=job-1'
    );
    assert.equal(
      resolveNotificationUrlForRole('job_status_update', 'guard', { requestId: 'job-1' }),
      '/guard/my-jobs?jc=job-1'
    );
  });

  it('opens staff support tickets in the messages inbox', () => {
    const url = resolveNotificationUrlForRole('support_ticket_status', 'administrator', {
      ticketId: 'ticket-1',
    });
    assert.equal(url, '/staff/messages?st=ticket-1');
  });
});

describe('missedCheckinDedupKey', () => {
  it('scopes dedup per job and hour bucket', () => {
    assert.equal(missedCheckinDedupKey('req-42', 12345), 'missed_checkin:req-42:12345');
  });
});

describe('isStaffSession', () => {
  it('recognizes staff platform roles', () => {
    assert.equal(
      isStaffSession({ userId: '1', email: 'a@b.com', role: 'administrator', platformRole: 'administrator' }),
      true
    );
  });

  it('rejects guard sessions for staff checks', () => {
    assert.equal(
      isStaffSession({ userId: '1', email: 'a@b.com', role: 'guard', platformRole: 'guard' }),
      false
    );
  });
});
