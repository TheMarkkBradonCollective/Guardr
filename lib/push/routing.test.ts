import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { rolesForNotificationType, resolveNotificationUrlForRole } from './routing.ts';
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
});

describe('resolveNotificationUrlForRole', () => {
  it('deep-links clients to their job map on emergencies', () => {
    const url = resolveNotificationUrlForRole('emergency_alert', 'client', { requestId: 'job-1' });
    assert.equal(url, '/client/map?jc=job-1');
  });

  it('deep-links guards to active job on emergencies', () => {
    const url = resolveNotificationUrlForRole('emergency_alert', 'guard', { requestId: 'job-1' });
    assert.equal(url, '/guard/my-jobs?jc=job-1');
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
